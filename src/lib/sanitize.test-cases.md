# `sanitizeArticleHtml` — hostile inputs and expected outputs

Checked by hand with a temporary script (task 13); the real output of each case is recorded below.
Links that keep a safe address get `rel="noopener nofollow" target="_blank"`. A link with a refused address keeps its text but loses the link.

| # | Input | Expected output |
|---|---|---|
| 1 | `<img src=x onerror=alert(1)>` | *(empty: `img` is not allowed)* |
| 2 | `<a href="javascript:alert(1)">x</a>` | `<a>x</a>` |
| 3 | `<script>alert(1)</script><p>hi</p>` | `<p>hi</p>` (the script and its body are gone) |
| 4 | `<p style="color:red" class="big" onclick="x()">text</p>` | `<p>text</p>` |
| 5 | `<a href="https://example.com/a?b=1&c=2" onclick="evil()" title="t">ok</a>` | `<a rel="noopener nofollow" target="_blank" href="https://example.com/a?b=1&c=2">ok</a>` |
| 6 | `<iframe src="https://evil.example"></iframe><p>after</p>` | `<p>after</p>` |
| 7 | `<a href="  JaVaScRiPt:alert(1)">y</a> <a href="data:text/html;base64,PHNjcmlwdD4=">z</a>` | `<a>y</a> <a>z</a>` |
| 8 | `<style>body{display:none}</style><svg onload=alert(1)><p>x</p></svg><!-- c --><p>y</p>` | `<p>x</p><p>y</p>` |
| 9 (good HTML) | `<h2>عنوان</h2><ul><li>بند <strong>مهم</strong></li></ul><blockquote>اقتباس</blockquote><a href="mailto:a@b.com">m</a><a href="tel:+963944123456">t</a>` | unchanged, except both links get `rel="noopener nofollow" target="_blank"` |
