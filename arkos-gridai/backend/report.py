from weasyprint import HTML
import tempfile

def make_pdf(scores: dict) -> bytes:
    """Generate a PDF report from the scores dict and return as bytes."""
    html_content = "<h1>Site Risk Report</h1>" + "".join(f"<p>{k}: {v}</p>" for k, v in scores.items())
    with tempfile.NamedTemporaryFile(suffix=".pdf") as f:
        HTML(string=html_content).write_pdf(f.name)
        f.seek(0)
        return f.read()
