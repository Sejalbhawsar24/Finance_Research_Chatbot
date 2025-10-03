"""Web crawler for extracting content from URLs."""
import httpx
from bs4 import BeautifulSoup
from typing import Optional


def crawl_url(url: str, timeout: int = 10) -> Optional[str]:
    """
    Crawl a URL and extract main content.
    """
    try:
        with httpx.Client(follow_redirects=True, timeout=timeout) as client:
            response = client.get(url, headers={
                "User-Agent": "Mozilla/5.0 (compatible; FinanceResearchBot/1.0)"
            })
            response.raise_for_status()
            
            soup = BeautifulSoup(response.text, "lxml")
            
            # Remove script and style elements
            for script in soup(["script", "style", "nav", "footer", "header"]):
                script.decompose()
            
            # Get text
            text = soup.get_text(separator="\n", strip=True)
            
            # Clean up whitespace
            lines = [line.strip() for line in text.splitlines() if line.strip()]
            content = "\n".join(lines)
            
            return content
            
    except Exception as e:
        print(f"Error crawling {url}: {e}")
        return None
