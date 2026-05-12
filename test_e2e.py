import httpx
import time
import os

# --- Step 1: Upload ---
print("=== STEP 1: UPLOADING PDF ===")
pdf_files = [f for f in os.listdir("temp_uploads") if f.endswith(".pdf")]
if not pdf_files:
    print("ERROR: No PDF found in temp_uploads.")
    exit(1)

pdf_path = os.path.join("temp_uploads", pdf_files[0])
print("Using: " + pdf_files[0])

with open(pdf_path, "rb") as f:
    files = {"file": (os.path.basename(pdf_path), f, "application/pdf")}
    t = time.time()
    res = httpx.post("http://127.0.0.1:8000/upload", files=files, timeout=60)
    elapsed = time.time() - t

print("Upload response time: {:.2f}s".format(elapsed))
print("Upload status: {}".format(res.status_code))
print("Upload body: {}".format(res.json()))

# --- Step 2: Wait for background processing ---
print("\n=== STEP 2: WAITING 45s FOR BACKGROUND EMBEDDING ===")
for i in range(45, 0, -5):
    print("  {}s remaining...".format(i))
    time.sleep(5)

# --- Step 3: Query ---
print("\n=== STEP 3: QUERYING ===")
questions = [
    "What is this document about?",
    "What are the key topics covered?",
]
for q in questions:
    t = time.time()
    res = httpx.post("http://127.0.0.1:8000/query", json={"question": q}, timeout=120)
    elapsed = time.time() - t
    data = res.json()
    print("Q: " + q)
    print("Status: {} | Time: {:.2f}s".format(res.status_code, elapsed))
    if res.status_code == 200:
        print("A: " + str(data.get("answer", "NO ANSWER")).encode("ascii", "replace").decode())
    else:
        print("ERROR: " + str(data)[:300])
    print("")
