import random

def get_tri_score(lat: float, lon: float) -> int:
    """Return a random TRI score between 0 and 100."""
    return random.randint(0, 100)
