# Vector Database Architecture

Vector databases are specialized systems optimized for storing and querying high-dimensional vectors, commonly used in machine learning and AI applications.

## Indexing Strategies

### HNSW (Hierarchical Navigable Small World)

HNSW builds a multi-layer graph structure for efficient approximate nearest neighbor search. The algorithm constructs a hierarchy where:

- Higher layers contain fewer nodes with longer connections
- Lower layers have more nodes with shorter connections
- Search starts from the top layer and descends

Performance characteristics:
- Build time: O(n * log(n))
- Query time: O(log(n))
- Memory overhead: 10-30% of vector data
- Recall typically exceeds 95% with proper tuning

Configuration parameters:
- M: Maximum connections per node (16-64)
- ef_construction: Search width during index building (64-512)
- ef_search: Search width during queries (64-256)

### IVF (Inverted File Index)

IVF partitions vectors into clusters and searches only relevant partitions:

1. Train k-means on sample data to create centroids
2. Assign each vector to nearest centroid
3. At query time, search only closest clusters

Trade-offs:
- Faster build than HNSW
- Lower memory overhead
- May miss results in adjacent clusters
- Requires retraining on distribution shift

## Distance Metrics

### Cosine Similarity

Measures the angle between vectors, normalized to [-1, 1]:

```
cos(a, b) = (a · b) / (||a|| * ||b||)
```

Advantages:
- Magnitude invariant
- Natural for text embeddings
- Efficient with normalized vectors

### Euclidean Distance

Measures straight-line distance between points:

```
d(a, b) = sqrt(sum((a_i - b_i)^2))
```

Advantages:
- Intuitive geometric interpretation
- Works well for dense embeddings
- Standard in clustering algorithms

### Inner Product

Simple dot product without normalization:

```
ip(a, b) = sum(a_i * b_i)
```

Advantages:
- Fastest computation
- Equivalent to cosine for normalized vectors
- Captures magnitude information

## Query Processing

### Pre-filtering vs Post-filtering

Pre-filtering applies metadata constraints before vector search:
- Reduces search space
- May miss relevant results at boundaries
- Better for highly selective filters

Post-filtering searches first, then applies constraints:
- Guarantees best vector matches
- May return fewer results than requested
- Better for loose filters

### Hybrid Search

Combines dense (vector) and sparse (keyword) retrieval:

1. Execute vector similarity search
2. Execute BM25 keyword search
3. Merge results using reciprocal rank fusion

RRF formula:
```
score(d) = sum(1 / (k + rank_i(d)))
```

Where k is typically 60 and rank_i is the document's position in list i.

## Scaling Considerations

### Sharding

Horizontal partitioning across nodes:
- Hash-based: Uniform distribution, poor locality
- Range-based: Better locality, potential hotspots
- Geographic: Minimizes latency for regional data

### Replication

Copies data for availability and read scaling:
- Synchronous: Strong consistency, higher latency
- Asynchronous: Lower latency, eventual consistency
- Quorum: Balances consistency and availability

### Caching

Vector search benefits from caching at multiple levels:
- Query cache: Stores recent search results
- Embedding cache: Avoids recomputing common queries
- Index cache: Keeps hot portions in memory

## Best Practices

1. Normalize vectors before storage for cosine similarity
2. Batch inserts for better throughput
3. Use appropriate index type for data size
4. Monitor recall metrics in production
5. Implement graceful degradation for high load
