CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(20) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  price BIGINT NOT NULL
);

INSERT INTO products (id, name, price)
VALUES
  ('1', 'Keyboard', 300000),
  ('2', 'Mouse', 150000),
  ('3', 'Monitor', 2500000)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  price = VALUES(price);
