import numpy as np
import hashlib
import random
import base64

class IdentIcon:
    @staticmethod
    def generate_identicon_svg(mongo_key, size=84, grid_size=7):
        """
        Generates a perfectly aligned GitHub-style identicon as an SVG.

        Args:
        - mongo_key (str): Unique MongoDB key (ObjectId or UUID).
        - size (int): Image size in pixels (default 84px for perfect grid alignment).
        - grid_size (int): Grid pattern (7x7 ensures symmetry and even padding).

        Returns:
        - Base64-encoded SVG string representing the identicon.
        """
        # Create a deterministic hash
        key_hash = hashlib.sha256(mongo_key.encode()).hexdigest()

        # Use hash to generate a consistent random seed
        seed = int(key_hash[:8], 16)
        random.seed(seed)

        # Generate a symmetrical pattern
        binary_pattern = [random.randint(0, 1) for _ in range(grid_size * (grid_size // 2 + 1))]
        pattern = np.array(binary_pattern).reshape((grid_size, grid_size // 2 + 1))

        # Mirror horizontally to get symmetry
        pattern = np.hstack([pattern, pattern[:, :-1][:, ::-1]])

        # Generate a random color with fixed-seed randomness
        r = (int(key_hash[8:10], 16) + random.randint(50, 150)) % 256
        g = (int(key_hash[10:12], 16) + random.randint(50, 150)) % 256
        b = (int(key_hash[12:14], 16) + random.randint(50, 150)) % 256
        fill_color = f"rgb({r},{g},{b})"

        # Background color
        bg_color = "#EEEEEE"

        # Ensure perfect fit: cell size must be evenly divisible
        cell_size = size // grid_size  # Ensures each cell is an integer size
        padding = (size - (cell_size * grid_size)) // 2  # Auto-center the grid

        # SVG content with background
        svg_elements = [f'<rect width="{size}" height="{size}" fill="{bg_color}"/>']

        for y in range(grid_size):
            for x in range(grid_size):
                if pattern[y, x] == 1:
                    rect_x, rect_y = padding + x * cell_size, padding + y * cell_size
                    svg_elements.append(
                        f'<rect x="{rect_x}" y="{rect_y}" width="{cell_size}" height="{cell_size}" fill="{fill_color}"/>'
                    )

        svg_content = f'<svg width="{size}" height="{size}" xmlns="http://www.w3.org/2000/svg">{"".join(svg_elements)}</svg>'

        return base64.b64encode(svg_content.encode()).decode()
