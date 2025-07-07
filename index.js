const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();
const PORT = 5000;

const products = require('./products.json');

app.use(cors());

async function getGoldPricePerGram() {
  try {
    const response = await axios.get('https://api.gold-api.com/price/XAU');
    const ouncePrice = response.data.price;
    const gramPrice = ouncePrice / 31.1035;
    return gramPrice;

  } catch (error) {
    console.warn('Price did not receive:', error.message);
    return 0;
  }
}

app.get('/products', async (req, res) => {
 const goldPrice = await getGoldPricePerGram();

  const updatedProducts = products.map(product => {
    const price = (product.popularityScore + 1) * product.weight * goldPrice;
    return {
      ...product,
      price: parseFloat(price.toFixed(2)),
      popularityOutOfFive: parseFloat((product.popularityScore * 5).toFixed(1))
    };
  });

  const minPrice = parseFloat(req.query.minPrice);
  const maxPrice = parseFloat(req.query.maxPrice);
  const minPopularity = parseFloat(req.query.minPopularity);
  const maxPopularity = parseFloat(req.query.maxPopularity);
  const sortBy = req.query.sortBy;
  const sortOrder = req.query.sortOrder;

  const filteredProducts = updatedProducts.filter(product => {
    const priceOk = (isNaN(minPrice) || product.price >= minPrice) &&
                    (isNaN(maxPrice) || product.price <= maxPrice);

    const popularityOk = (isNaN(minPopularity) || product.popularityOutOfFive >= minPopularity) &&
                         (isNaN(maxPopularity) || product.popularityOutOfFive <= maxPopularity);

    return priceOk && popularityOk;
  });

  if (sortBy) {
  filteredProducts.sort((a, b) => {
    if (sortBy === 'price') {
      return sortOrder === 'asc' ? a.price - b.price : b.price - a.price;
    } else if (sortBy === 'popularity') {
      return sortOrder === 'asc' ? a.popularityOutOfFive - b.popularityOutOfFive : b.popularityOutOfFive - a.popularityOutOfFive;
    }
    return 0;
  });
}

  res.json(filteredProducts);
});

app.listen(PORT, () => {
  console.log(`✅ Server is running at: http://localhost:${PORT}/products`);
});
