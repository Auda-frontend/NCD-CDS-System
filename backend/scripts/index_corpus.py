# scripts/index_corpus.py
# Indexes rag_corpus_semantic.json into local Docker Qdrant
# Run once: python scripts/index_corpus.py --corpus backend/scripts/rag_corpus_semantic.json

import json
import argparse
from sentence_transformers import SentenceTransformer
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct

def main(corpus_path: str, qdrant_host: str):

    # ── Step 1: Load corpus ─────────────────────────────────────────
    with open(corpus_path, "r", encoding="utf-8") as f:
        corpus = json.load(f)

    texts = [c["text"] for c in corpus]
    print(f"Loaded {len(texts)} chunks from {corpus_path}")

    # ── Step 2: Load embedding model ────────────────────────────────
    print("Loading embedding model on CPU...")
    embedder = SentenceTransformer(
        "nomic-ai/nomic-embed-text-v1.5",
        trust_remote_code=True,
        device="cpu"
    )

    print("Generating embeddings (5-15 minutes on CPU)...")
    embeddings = embedder.encode(texts, batch_size=16, show_progress_bar=True)
    print(f"Embeddings shape: {embeddings.shape}")

    # ── Step 3: Connect to Qdrant ───────────────────────────────────
    client = QdrantClient(host=qdrant_host, port=6333)
    collection_name = "rag_corpus"

    # Verify connection
    try:
        client.get_collections()
        print(f"✓ Connected to Qdrant at {qdrant_host}:6333")
    except Exception as e:
        print(f"✗ Cannot connect to Qdrant: {e}")
        print(f"  Make sure Docker is running: docker start qdrant-ncd")
        return

    # ── Step 4: Create collection ───────────────────────────────────
    # Fix: recreate_collection is deprecated — use collection_exists instead
    existing = [col.name for col in client.get_collections().collections]

    if collection_name in existing:
        print(f"Collection '{collection_name}' already exists")
        answer = input("Delete and recreate? (y/n): ").strip().lower()
        if answer == "y":
            client.delete_collection(collection_name)
            print(f"  Deleted existing collection")
        else:
            print(f"  Keeping existing collection — adding new points")

    if collection_name not in [col.name for col in client.get_collections().collections]:
        client.create_collection(
            collection_name=collection_name,
            vectors_config=VectorParams(
                size=embeddings.shape[1],
                distance=Distance.COSINE
            )
        )
        print(f"✓ Collection '{collection_name}' created")

    # ── Step 5: Build points with full metadata payload ─────────────
    points = [
        PointStruct(
            id=i,
            vector=embeddings[i].tolist(),
            payload={
                "text":         corpus[i].get("text", ""),
                "source":       corpus[i].get("source", "unknown"),
                "page":         corpus[i].get("page", 0),
                "conditions":   corpus[i].get("conditions", ["general"]),
                "content_type": corpus[i].get("content_type", "general_guideline"),
                "word_count":   corpus[i].get("word_count", 0)
            }
        )
        for i in range(len(corpus))
    ]

    # ── Step 6: Upload in batches ───────────────────────────────────
    BATCH_SIZE = 100
    total_batches = (len(points) + BATCH_SIZE - 1) // BATCH_SIZE
    print(f"\nUploading {len(points)} vectors in {total_batches} batches...")

    for batch_num, i in enumerate(range(0, len(points), BATCH_SIZE), 1):
        batch = points[i:i + BATCH_SIZE]
        client.upsert(collection_name=collection_name, points=batch)
        indexed = min(i + BATCH_SIZE, len(points))
        print(f"  Batch {batch_num}/{total_batches} — {indexed}/{len(points)} indexed")

    # ── Step 7: Verify ──────────────────────────────────────────────
    total = client.get_collection(collection_name).points_count
    print(f"\n✓ Indexing complete")
    print(f"  Vectors stored: {total}/{len(corpus)}")

    if total == len(corpus):
        print(f"  ✓ All chunks indexed successfully")
    else:
        print(f"  ✗ {len(corpus) - total} chunks missing — re-run to fix")

    # ── Step 8: Quick retrieval test ────────────────────────────────
    print(f"\n─── Quick Retrieval Test ───")
    test_query = "Stage 2 hypertension first-line treatment Rwanda"
    query_vector = embedder.encode(test_query).tolist()

    response = client.query_points(
        collection_name=collection_name,
        query=query_vector,
        limit=3
    )
    results = response.points

    print(f"Query: '{test_query}'")
    for rank, hit in enumerate(results, 1):
        print(f"  Rank {rank} | Score: {hit.score:.4f} | "
              f"{hit.payload.get('source')} p.{hit.payload.get('page')}")
        print(f"    {hit.payload.get('text', '')[:120]}...")

    top_score = results[0].score if results else 0
    if top_score >= 0.65:
        print(f"\n✓ Retrieval working — score {top_score:.4f}")
        print(f"✓ Ready for llm_service.py integration")
    else:
        print(f"\n⚠ Low retrieval score {top_score:.4f}")
        print(f"  Check corpus quality and document coverage")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Index RAG corpus into Qdrant")
    parser.add_argument(
        "--corpus",
        type=str,
        required=True,
        help="Path to rag_corpus_semantic.json"
    )
    parser.add_argument(
        "--qdrant-host",
        type=str,
        default="localhost",
        help="Qdrant host (default: localhost)"
    )
    args = parser.parse_args()
    main(args.corpus, args.qdrant_host)