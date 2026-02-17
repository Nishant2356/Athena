-- Enable the pgvector extension to work with embedding vectors
create extension if not exists vector;

-- Create a table for documents
create table if not exists documents (
  id bigserial primary key,
  content text, -- The text chunk
  metadata jsonb, -- Original file name, page number, etc.
  embedding vector(768) -- Google Gemini embedding size (text-embedding-004). Change to 1536 for OpenAI.
);

-- Function to match documents
create or replace function match_documents (
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
returns table (
  id bigint,
  content text,
  metadata jsonb,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    documents.id,
    documents.content,
    documents.metadata,
    1 - (documents.embedding <=> query_embedding) as similarity
  from documents
  where 1 - (documents.embedding <=> query_embedding) > match_threshold
  order by documents.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- Create an index for faster similarity search
create index on documents using ivfflat (embedding vector_cosine_ops)
with (lists = 100);
