# Exact positivity and a threshold resonance of the neutral-mouth operator

**Status:** an exact operator identity and zero-energy theorem for the published extremal-mouth master system. The finite-frequency scattering calculation is a separate numerical result. The threshold transmission formula in Section 6 is a matching prediction until the uniform threshold lemma stated there is established.  
**Date:** 2026-10-22.  
**Scope:** one extremal mouth, linear perturbations, the published lowest-Landau-level response, multipole $l\geq2$, and fixed finite screening parameter $M>0$. This is not a theorem about the complete finite-length wormhole or a physical quantum apparatus.

## 1. Published input and normalization

The input is [Sadhukhan, arXiv:2610.09847v1](https://arxiv.org/html/2610.09847v1), Eqs. (5.20)--(5.22). We set $r_e=GM=1$ and write

$$
L=l(l+1),\qquad \mu=\sqrt{L-2},\qquad M=m_S^2>0,
\qquad f(r)=\frac{(r-1)^2}{r^2},\quad r>1.
$$

The dimensionless tortoise coordinate is

$$
x=r+2\log(r-1)-\frac1{r-1},\qquad
\frac{dr}{dx}=f(r).
$$

Thus $r\downarrow1$ corresponds to $x\to-\infty$ and $r\to\infty$ to $x\to+\infty$. Restoring dimensions multiplies $x$ by $r_e$, frequencies by $r_e^{-1}$, and the potential by $r_e^{-2}$.

The published variables $Z=(\Psi_g,\Psi_D,\Xi)^T$ are transformed by the constant positive matrix

$$
Y=S Z,\qquad S=\operatorname{diag}(\mu,1,\sqrt{LM}).
$$

They obey $H Y=\omega^2Y$, where

$$
H=-\partial_x^2+V(x),
$$

$$
V=f\begin{pmatrix}
L/r^2-6/r^3+4/r^4&-2\mu/r^3&0\\
-2\mu/r^3&L/r^2+4/r^4&\sqrt{LM}/r^2\\
0&\sqrt{LM}/r^2&M/r^2
\end{pmatrix}.
$$

The potential is a bounded, smooth, real symmetric matrix on the entire $x$ line and tends to zero at both ends. We use the standard self-adjoint realization on $L^2(\mathbb R,\mathbb C^3)$ with domain $H^2(\mathbb R,\mathbb C^3)$.

No large-$M$ elimination is used in the theorem below. The background extremal-mouth approximation and the matter response are inherited from the source; the displayed identities are algebraic consequences of that specified operator.

## 2. Exact positive factorization

Define

$$
W=\operatorname{diag}(f/r,0,0),\qquad Q=\partial_x+W,
$$

$$
w_1=(\mu,-2/r,0)^T,\qquad
w_2=(0,\sqrt L,\sqrt M)^T.
$$

Then the operator factorizes exactly as

$$
\boxed{H=Q^\dagger Q+\frac f{r^2}
\left(w_1w_1^T+w_2w_2^T\right).}
$$

To check it, $Q^\dagger Q=-\partial_x^2+W^2-W_x$, and the only nonzero diagonal entry of $W^2-W_x$ is

$$
\left(\frac f r\right)^2-
f\frac{d}{dr}\left(\frac f r\right)
=f\left(\frac2{r^2}-\frac6{r^3}+\frac4{r^4}\right).
$$

Adding the two rank-one terms gives every entry of $V$, using $\mu^2+2=L$.

For a compactly supported smooth vector $Y$,

$$
\langle Y,HY\rangle=
\int_{\mathbb R}\left[
|QY|^2+\frac f{r^2}|w_1^TY|^2+
\frac f{r^2}|w_2^TY|^2\right]dx\geq0.
$$

By closure this holds on the form domain. Consequently the specified mouth operator has no negative spectrum. In particular it has no normalizable mode with $\omega^2<0$. This conclusion does not require estimating the smallest pointwise eigenvalue of $V$; that eigenvalue can be negative without making the full operator negative.

## 3. Unique bounded zero-energy solution

The simultaneous equations $Q u=0$, $w_1^Tu=0$, and $w_2^Tu=0$ have the nonzero solution

$$
\boxed{u_0(r)=
\left(-\frac{2\sqrt M}{\mu r},-\sqrt M,\sqrt L\right)^T.}
$$

It follows immediately from the factorization that $Hu_0=0$. Direct substitution gives the same result.

This solution is bounded, but is not square integrable: its second and third components are nonzero constants. It is a zero-energy resonance, not a normalizable zero-energy bound state.

The bounded solution is unique up to scalar multiplication. To prove this, let $u$ be any bounded classical solution of $Hu=0$. Since $V=O(|x|^{-2})$, the equation gives $u''=O(|x|^{-2})$. Therefore $u'$ has finite limits at the two ends. Boundedness forces those limits to vanish, and hence $u'=O(|x|^{-1})$. Also $W\to0$. Integrating the factorization over $[-R,R]$ gives

$$
\int_{-R}^{R}\left[|Qu|^2+\frac f{r^2}|w_1^Tu|^2+
\frac f{r^2}|w_2^Tu|^2\right]dx
=\operatorname{Re}[u^\dagger Qu]_{-R}^{R}.
$$

The right side tends to zero. Every integrand is nonnegative, so $Qu=0$ and $w_i^Tu=0$ everywhere. The first equation gives

$$
u_1=c_1/r,\qquad u_2=c_2,\qquad u_3=c_3.
$$

The algebraic constraints are $\mu c_1=2c_2$ and $\sqrt Lc_2+\sqrt Mc_3=0$. Their solution space is one-dimensional and is spanned by $u_0$. An $L^2$ zero eigenfunction would be bounded by the operator domain and would therefore be a multiple of $u_0$; square integrability forces that multiple to vanish.

Thus the exact conclusions are:

1. $H\geq0$ for every fixed $l\geq2$, $M>0$.
2. There is no negative-energy bound state and no zero-energy bound state.
3. There is exactly one linearly independent bounded zero-energy resonance.

### 3.1 A compact attractive perturbation binds at every strength

The resonance makes positivity sensitive to a specified class of attractive perturbations. Let $B(x)$ be a bounded, compactly supported, Hermitian matrix multiplication operator with $B(x)\geq0$ almost everywhere, and suppose

$$
I_B=\int_{\mathbb R}u_0^\dagger B(x)u_0\,dx>0.
$$

Then, for every $\varepsilon>0$, the operator

$$
H_\varepsilon=H-\varepsilon B
$$

has at least one negative discrete eigenvalue.

For a proof, choose a real $\chi\in C_c^\infty(\mathbb R)$ equal to one on $[-1,1]$ and zero outside $[-2,2]$, and set

$$
\chi_R(x)=\chi(x/R),\qquad \psi_R=\chi_Ru_0.
$$

Since $Qu_0=0$ and $w_i^Tu_0=0$, the factorization gives the exact cutoff identity

$$
\langle\psi_R,H\psi_R\rangle
=\int_{\mathbb R}|\chi_R'(x)|^2|u_0(x)|^2\,dx
\leq\frac{\|u_0\|_\infty^2}{R}
\int_{\mathbb R}|\chi'(s)|^2\,ds.
$$

For sufficiently large $R$, the cutoff equals one throughout the support of $B$. The perturbation term is then exactly $-\varepsilon I_B$, so

$$
\langle\psi_R,H_\varepsilon\psi_R\rangle
\leq \frac{C_\chi}{R}-\varepsilon I_B<0
$$

once $R>C_\chi/(\varepsilon I_B)$. Dividing by the nonzero norm of $\psi_R$ gives a negative Rayleigh quotient. The potential $V$ is bounded and tends to zero at both ends, and $B$ is bounded with compact support. Both are relatively compact perturbations of the free resolvent by local compactness and a tail estimate. Thus $\sigma_{\mathrm{ess}}(H_\varepsilon)=[0,\infty)$. The negative variational value therefore implies a negative discrete eigenvalue, rather than a change of the essential-spectrum threshold.

This is a conditional operator statement. It does not determine the sign, locality, or matrix form of omitted physical corrections. It makes no claim that those corrections satisfy $B\geq0$ with $I_B>0$, and it does not establish instability of a complete wormhole. If the perturbation does not overlap the resonance, $I_B=0$, the displayed argument gives no binding conclusion.

## 4. Endpoint channels and inverse-square tails

The potential has different inverse-square coefficient matrices at its two ends:

$$
V(x)=\frac{C_\pm}{x^2}
+O\!\left(\frac{\log|x|}{|x|^3}\right),
\qquad x\to\pm\infty,
$$

$$
C_-=
\begin{pmatrix}
L-2&-2\mu&0\\
-2\mu&L+4&\sqrt{LM}\\
0&\sqrt{LM}&M
\end{pmatrix},
\quad
C_+=
\begin{pmatrix}
L&0&0\\
0&L&\sqrt{LM}\\
0&\sqrt{LM}&M
\end{pmatrix}.
$$

Each matrix has a one-dimensional kernel. The resonance approaches

$$
u_-=
(-2\sqrt M/\mu,-\sqrt M,\sqrt L)^T,
\qquad u_+=(0,-\sqrt M,\sqrt L)^T.
$$

Define

$$
a=\|u_-\|=\sqrt{L+M+\frac{4M}{L-2}},\qquad
b=\|u_+\|=\sqrt{L+M},
\qquad n_-=u_-/a,\quad n_+=u_+/b.
$$

These are the normalized *dressed neutral endpoint channels*. A pure coordinate component such as $\Xi$ is a different incident state.

The two nonzero eigenvalues of $C_+$ are $L$ and $L+M$. Those of $C_-$ are

$$
\lambda_\pm=\frac12\left[
2L+2+M\pm\sqrt{(M-2)^2+16L}\right].
$$

Both are positive. In particular $\lambda_-\geq l(l-1)\geq2$; it increases with $M$. An inverse-square eigenchannel with coefficient $c>0$ has zero-energy homogeneous solutions $|x|^{1/2\pm\nu}$, where $\nu=\sqrt{1/4+c}$. The centrifugal channels therefore have a decaying and a growing zero-energy solution. The neutral channels instead have constant and linear leading solutions, with smaller corrections and mixing.

The first moment of the full matrix potential is not integrable. A scalar short-range threshold theorem assuming $\int(1+|x|)\|V(x)\|dx<\infty$ cannot be applied directly. The inverse-square channels must be treated as part of the reference problem. For comparison, [Egorova, Holzleitner and Teschl, arXiv:1504.05744](https://arxiv.org/abs/1504.05744) state moment assumptions for scalar zero-energy scattering; [Costin et al., arXiv:0804.2282](https://arxiv.org/abs/0804.2282) specifically treat scalar inverse-square asymptotics. Neither is being cited as a proof of the matrix threshold claim below.

## 5. Conserved master flux

For a real frequency $k=\omega>0$, symmetry of $V$ gives the conserved sesquilinear Wronskian and, in particular,

$$
j[Y]=\operatorname{Im}(Y^\dagger Y_x),\qquad \partial_xj=0.
$$

In the original published variables this is

$$
j[Z]=\operatorname{Im}\left[
\mu^2\Psi_g^*\partial_x\Psi_g+
\Psi_D^*\partial_x\Psi_D+
LM\Xi^*\partial_x\Xi\right].
$$

At either end a unit vector multiplying $e^{ikx}$ has positive flux $k$; $e^{-ikx}$ has flux $-k$. A flux-normalized scattering matrix of this conservative master system must include all three outgoing channels on both sides.

This mathematical flux supplies an unambiguous classical master-channel scattering convention. Identifying it with a physical one-particle quantum norm requires a reduction of the four-dimensional symplectic form. In particular the source's Eq. (3.5) includes time derivatives in $\Psi_e$ and $\Xi$, while $\Psi_g$ is a Regge--Wheeler variable. We do not infer a physical qubit fidelity from the Wronskian alone.

## 6. Threshold matching prediction and its precise proof obligation

Consider incidence in $n_-$ from the left and no incidence from the right. Denote the neutral reflection and transmission amplitudes by $r(k)$ and $t(k)$.

If the scattering state has a bounded matched zero-energy limit $C u_0$, and outgoing centrifugal-channel amplitudes vanish as $k\downarrow0$, the constant terms and Wronskian terms imply

$$
1+r_0=C a,\qquad t_0=C b,\qquad
a(1-r_0)=b t_0.
$$

Solving gives

$$
r_0=\frac{a^2-b^2}{a^2+b^2}
=\frac{2M}{L(L+M-2)},
$$

$$
t_0=\frac{2ab}{a^2+b^2},\qquad
\boxed{T_0=|t_0|^2=
1-\left[\frac{2M}{L(L+M-2)}\right]^2.}
$$

The reverse-incidence reflection amplitude changes sign in the same real phase convention. The strictly large-$M$ expression is $T_0\to1-4/L^2$. These expressions concern the dressed neutral channels and the declared master flux.

The matching algebra is exact once its hypotheses hold. A complete threshold theorem still needs the following uniform statement for this matrix operator:

> For neutral unit incident amplitude (incident flux $k$), the scattering solution converges on compact sets to a multiple of the unique bounded resonance, admits that same expansion in overlapping endpoint regions $1\ll|x|\ll1/k$, and has outgoing centrifugal amplitudes tending to zero. Its endpoint Wronskians have the free-neutral limits to error $o(k)$.

The relevant reference solutions in a centrifugal eigenchannel are $\sqrt{k|x|}\,H_\nu^{(1,2)}(k|x|)$, with $\nu=\sqrt{1/4+c}$, rather than plane waves in the overlap region. In the fixed endpoint eigenbases the residual potential is $O(\log|x|/|x|^3)$, which does have an integrable first moment. The absence of an $L^2$ zero mode and uniqueness of the bounded resonance remove two possible threshold obstructions, but they do not substitute for the uniform estimates.

For clarity, the Wronskian matching can be formulated at $R(k)=k^{-\beta}$ with $1/2<\beta<1$. If the required bounded overlap expansion holds, $kR(k)\to0$ and $\log R(k)/(kR(k)^2)\to0$. Moreover, for $H\psi_k=k^2\psi_k$,

$$
\frac{d}{dx}\left[u_0^T\psi_k'-u_0'^T\psi_k\right]
=-k^2u_0^T\psi_k.
$$

Integrating from $-R(k)$ to $R(k)$ gives an $o(k)$ difference under the boundedness estimate. The neutral endpoint terms then yield $a(1-r_0)=bt_0$. This displays exactly where the remaining analytic estimate enters, instead of silently assuming short-range scalar scattering.

Numerical convergence toward the displayed threshold law can be reported as numerical evidence. It does not by itself complete the uniform analytic proof.

## 7. Large-screening limit and limits of the conclusion

The source's Eq. (5.26) is a two-channel large-screening reduction. Its elimination condition is local:

$$
\omega,\;\hbox{inverse variation scales}\ll
\frac{\sqrt M\sqrt\Delta}{r^2},\qquad\Delta=(r-1)^2.
$$

At finite $M$ the right side vanishes at both ends of the extremal mouth. Thus pointwise algebraic elimination is not automatically a uniform scattering approximation. The full three-channel factorization above avoids that issue. A numerical large-$M$ comparison should be taken after solving the finite-$M$ scattering problem, with endpoint and frequency convergence controlled separately.

The theorem establishes positivity and a unique zero resonance of one specified extremal-mouth operator. It does not establish stability of two mouths connected by a finite throat, robustness under all omitted backreaction terms, physical preparation of the dressed incident mode, recoverable qubit transmission, or scientific priority. The factorization method is standard; priority must concern the explicit application and its consequences after comparison with prior literature.
