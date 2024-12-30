import { initMongoose } from "@/dbConnect/db";
import Product from "../../models/Product";

export async function findAllProducts() {
  return Product.find().exec();
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function GET(req, res) {
  await initMongoose();
  const { ids } = req.query;
  if (ids) {
    const idsArray = ids.split(",");
    res.json(
      await Product.find({
        _id: { $in: idsArray },
      }).exec()
    );
  } else {
    res.json(await findAllProducts());
  }
}

export async function POST(req, res) {
  await initMongoose();
  try {
    const formData = await req.formData();
    const imageFile = formData.get("image");
    const name = formData.get("name");
    const description = formData.get("description");
    const price = formData.get("price");
    const category = formData.get("category");

    const byte = await imageFile.arrayBuffer();
    const buffer = Buffer.from(byte);

    const result = await new Promise((resolve, reject) =>
      cloudinary.uploader.upload(
        buffer,
        { folder: "product" },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      )
    );

    const product = await Product.create({
      name,
      description,
      price,
      category,
      picture: result.secure_url,
    });
    res.json(product);
  } catch (error) {
    res.json({ message: "Something went wrong" }, { status: 500 });
  }
}
