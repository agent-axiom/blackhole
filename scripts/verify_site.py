#!/usr/bin/env python3
"""Check public-site artifacts and provenance without rerunning the research."""

from __future__ import annotations

import csv
import hashlib
from html.parser import HTMLParser
import itertools
import json
import math
from pathlib import Path
import re
import sys
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / "site"
REVISION = "00bc6243983dfdc3bae3a15345bf73f9db3e6bc2"
PDF_SHA256 = "625cc7318e702010465003028236e917cff1f3195b8d93809c471d6db2ead4e3"
SOURCE_SHA256 = "713c530a622277d9b47124a993dcb90220397d6b1e591c145b6d9750bade77e0"
FREQUENCIES = (1e-5, 3e-5, 1e-4, 3e-4, .001, .003, .01, .03, .1, .3)


def require(condition: bool, message: str) -> None:
    if not condition:
        raise ValueError(message)


def read_json(relative: str) -> dict:
    return json.loads((SITE / relative).read_text(encoding="utf-8"))


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def close(a: float, b: float) -> bool:
    return math.isclose(a, b, rel_tol=1e-12, abs_tol=2e-15)


class HTMLReferences(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.ids: set[str] = set()
        self.references: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attributes = dict(attrs)
        if value := attributes.get("id"):
            require(value not in self.ids, f"Duplicate HTML anchor: {value}")
            self.ids.add(value)
        for name in ("href", "src", "poster"):
            if value := attributes.get(name):
                self.references.append(value)


def local_target(source: Path, reference: str) -> tuple[Path, str] | None:
    url = urlsplit(reference)
    if url.scheme or url.netloc:
        return None
    target = source if not url.path else (
        SITE / unquote(url.path).lstrip("/") if url.path.startswith("/")
        else source.parent / unquote(url.path)
    )
    target = target.resolve()
    require(target.is_relative_to(SITE.resolve()), f"Local reference leaves site/: {source.name}: {reference}")
    if target.is_dir():
        target = target / "index.html"
    require(target.is_file(), f"Missing local asset: {source.relative_to(SITE)} → {reference}")
    return target, unquote(url.fragment)


def verify_links() -> int:
    html: dict[Path, HTMLReferences] = {}
    references: list[tuple[Path, str]] = []
    for source in SITE.rglob("*"):
        require(not source.is_symlink(), f"Pages artifact contains a symlink: {source.relative_to(SITE)}")
        if not source.is_file():
            continue
        if source.suffix == ".html":
            parser = HTMLReferences()
            parser.feed(source.read_text(encoding="utf-8"))
            html[source.resolve()] = parser
            references.extend((source, ref) for ref in parser.references)
        elif source.suffix == ".js":
            text = source.read_text(encoding="utf-8")
            pattern = r"(?:\bfrom\s*|\bimport\s*\(?\s*|\bfetch\s*\(\s*|\bnew\s+URL\s*\(\s*)(['\"])([^'\"]+)\1"
            references.extend((source, ref) for _, ref in re.findall(pattern, text))
        elif source.suffix == ".css":
            for match in re.findall(r"url\(\s*([^)]*?)\s*\)", source.read_text(encoding="utf-8")):
                references.append((source, match.strip("\"'")))
    count = 0
    for source, reference in references:
        resolved = local_target(source, reference)
        if resolved is None:
            continue
        target, fragment = resolved
        if fragment and target.suffix == ".html":
            require(fragment in html[target].ids, f"Missing anchor: {source.name} → {reference}")
        count += 1
    return count


def verify_papers(registry: dict, provenance: dict) -> int:
    papers = registry["papers"]
    require(bool(papers), "The manuscript registry is empty.")
    require(len({p["slug"] for p in papers}) == len(papers), "Duplicate manuscript slug.")
    require(len({p["number"] for p in papers}) == len(papers), "Duplicate manuscript number.")
    for paper in papers:
        for field in ("title", "author", "status", "status_label", "summary", "source_revision"):
            require(isinstance(paper[field], str) and bool(paper[field].strip()), f"Missing {field} for paper {paper['number']}.")
        require(bool(re.fullmatch(r"[0-9a-f]{40}", paper["source_revision"])), "Invalid research revision.")
        require(type(paper["peer_reviewed"]) is bool, "Peer-review status must be explicit.")
        require(paper["arxiv_id"] is None or bool(re.fullmatch(r"\d{4}\.\d{4,5}(?:v\d+)?", paper["arxiv_id"])), "Invalid announced arXiv identifier.")
        resolved = local_target(SITE / "index.html", paper["pdf"])
        require(resolved is not None, "Registered manuscript PDFs must be local frozen artifacts.")
        path, _ = resolved
        require(path.read_bytes().startswith(b"%PDF-"), f"Invalid PDF: {path.name}")
        require(digest(path) == paper["pdf_sha256"], f"Manuscript hash mismatch: {path.name}")
    first = papers[0]
    require(first["number"] == "01" and first["source_revision"] == REVISION, "First-paper frozen revision changed.")
    require(first["pdf_sha256"] == PDF_SHA256 == provenance["manuscript_pdf_sha256"], "First-paper frozen PDF changed.")
    require(provenance["manuscript_source_revision"] == REVISION, "Provenance revision mismatch.")
    return len(papers)


def verify_data(provenance: dict) -> int:
    data = read_json("data/scattering.json")
    manifest = read_json("data/solver-manifest.json")
    require(data["provenance"]["revision"] == REVISION, "Chart dataset revision mismatch.")
    require(data["provenance"]["source_sha256"] == SOURCE_SHA256 == provenance["data_source_sha256"], "Original scattering source hash mismatch.")
    require(manifest["artifact_sha256"]["scattering.json"] == SOURCE_SHA256, "Solver manifest source hash mismatch.")
    for name in ("scattering.csv", "convergence.json"):
        require(digest(SITE / "data" / name) == manifest["artifact_sha256"][name], f"Frozen original artifact changed: {name}")
    for key in ("convergence_data", "source_manifest"):
        local_target(SITE / "data/provenance.json", provenance[key])
    with (SITE / "data/scattering.csv").open(encoding="utf-8", newline="") as stream:
        original = list(csv.DictReader(stream))
    key = lambda row: (int(row["ell"]), float(row.get("M", row.get("screening"))), float(row["k"]))
    csv_rows = {key(row): row for row in original}
    rows = {key(row): row for row in data["records"]}
    grid = set(itertools.product((2, 3, 5), (1., 10., 100.), FREQUENCIES))
    require(len(rows) == len(data["records"]) == len(original) == len(csv_rows) == 90, "Missing or duplicate scattering records.")
    require(set(rows) == set(csv_rows) == grid, "The archived scattering grid changed.")
    fields = ("k", "Tneutral", "T", "R", "flux_error", "max_interior_flux_error", "tol", "extent")
    for parameters, row in rows.items():
        source = csv_rows[parameters]
        for field in fields:
            require(math.isfinite(row[field]) and row[field] == float(source[field]), f"JSON/CSV mismatch at {parameters}: {field}")
        require(row["T_match"] == float(source["T0"]), f"Threshold prediction mismatch at {parameters}.")
        converted = row["transmitted_conversion"] + row["reflected_conversion"]
        require(close(converted, float(source["conversion"])), f"Channel conversion mismatch at {parameters}.")
        require(close(row["Tneutral"] + row["transmitted_conversion"], row["T"]), f"Transmitted flux partition mismatch at {parameters}.")
        require(row["R"] - row["reflected_conversion"] >= -2e-15, f"Negative neutral reflection at {parameters}.")
        require(close(row["R"] + row["T"] - 1, row["flux_error"]), f"Recorded flux residual mismatch at {parameters}.")
    summary = provenance["numerical_summary"]
    require(summary["grid_solves"] == provenance["base_solutions"] == len(rows), "Numerical summary count mismatch.")
    require(close(max(abs(r["flux_error"]) for r in rows.values()), summary["maximum_absolute_flux_defect"]), "Numerical summary flux diagnostic mismatch.")
    convergence = read_json("data/convergence.json")
    refinements = sum(1 + len(case["extent_steps"]) for case in convergence["cases"])
    require(refinements == provenance["refinement_solutions"] == summary["refinement_solves"], "Refinement count mismatch.")
    return len(rows)


def main() -> None:
    provenance = read_json("data/provenance.json")
    papers = verify_papers(read_json("data/research.json"), provenance)
    records = verify_data(provenance)
    links = verify_links()
    print(f"Verified {papers} manuscript(s), including the frozen eight-page first-paper PDF.")
    print(f"Verified {records} saved scattering samples, source hashes and refinement provenance.")
    print(f"Verified {links} literal local asset/anchor references.")
    print("No research computation or external-link check was performed.")


if __name__ == "__main__":
    try:
        main()
    except (OSError, ValueError, KeyError, TypeError) as error:
        print(f"Site verification failed: {error}", file=sys.stderr)
        sys.exit(1)
