import db from "../db/config.js";
import { products, businesses } from "../db/schema.js";
import { eq, and } from "drizzle-orm";

const productModel = {

    async addProduct(businessId, name, description, category, price, stock) {

        const result = await db
        .insert(products)
        .values({
            businessId, 
            name, 
            description, 
            category, 
            price, 
            stock,
        })
        .returning({
            id: products.id,
            businessId: products.businessId,
            name: products.name,
            description: products.description,
            category: products.category,
            price: products.price,
            stock: product
        }) 

    }

};

export default productModel;
