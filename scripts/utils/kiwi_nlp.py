import json
import re
import sys

from kiwipiepy import Kiwi


ALLOWED_TAGS = {"NNG", "NNP", "SL"}
PRODUCT_PATTERN = re.compile(r"\b[A-Za-z]*\d[A-Za-z0-9+.#&-]{1,}\b|\b[A-Z]{2,}[A-Za-z0-9+.#&-]*\b")


def normalize_text(text, aliases):
    value = str(text or "")
    for source, target in aliases.items():
        value = re.sub(re.escape(source), target, value, flags=re.IGNORECASE)
    return value


def main():
    payload = json.loads(sys.stdin.buffer.read().decode("utf-8"))
    texts = payload.get("texts") or []
    dictionary = payload.get("dictionary") or []
    aliases = payload.get("aliases") or {}

    kiwi = Kiwi()
    for word in dictionary:
        if isinstance(word, str) and len(word.strip()) >= 2:
            try:
                kiwi.add_user_word(word.strip(), "NNP")
            except Exception:
                pass

    documents = []
    for text in texts:
        normalized = normalize_text(text, aliases)
        tokens = []
        seen_products = set()

        for token in kiwi.tokenize(normalized):
            if token.tag not in ALLOWED_TAGS:
                continue
            form = token.form.strip()
            if len(form) >= 2:
                tokens.append(form)

        # Kiwi can split model names like 9800X3D unless they are known words.
        for match in PRODUCT_PATTERN.finditer(normalized):
            product = match.group(0).strip()
            if len(product) >= 2 and product not in seen_products:
                tokens.append(product)
                seen_products.add(product)

        documents.append(tokens)

    output = json.dumps({"documents": documents}, ensure_ascii=False)
    sys.stdout.buffer.write(output.encode("utf-8"))


if __name__ == "__main__":
    main()
