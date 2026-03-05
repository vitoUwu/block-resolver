import type { VtexProduct } from "../loaders/products/list";

interface Props {
  products: VtexProduct[];
}

export default function Shelf({ products }: Props) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
      {products.map((product) => (
        <div style={{ width: 200 }} key={product.productId}>
          <h3>{product.productName}</h3>
          <p>{product.productTitle}</p>
          <p>{product.brand}</p>
          <div>
            {product.items.map((item, index) =>
              index > 0 ? null : (
                <div key={item.itemId}>
                  <img
                    style={{ width: 100, height: 100 }}
                    src={item.images[0]?.imageUrl}
                    alt={item.images[0]?.imageLabel}
                  />
                  <p>{item.name}</p>
                  <p>{item.nameComplete}</p>
                </div>
              ),
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
