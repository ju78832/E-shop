import { initMongoose } from "@/dbConnect/db";
import Product from "@/models/Product";
import { v2 as cloudinary } from "cloudinary";
import { NextResponse } from "next/server";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function GET(req, res) {
  await initMongoose();
  const { searchParams } = new URL(req.url);
  const ids = searchParams.get("ids");
  if (ids) {
    const idsArray = ids.split(",");
    return NextResponse.json(
      await Product.find({
        _id: { $in: idsArray },
      }).exec()
    );
  } else {
    const products = await Product.find();
    return NextResponse.json({ products });
  }
}

export async function POST(req, res) {
  await initMongoose();
  try {
    const formData = await req.formData();
    const file = formData.get("image");
    const name = formData.get("name");
    const description = formData.get("description");
    const price = formData.get("price");
    const category = formData.get("category");

    if (!file) {
      return NextResponse.json(
        { message: "Image is required" },
        { status: 400 }
      );
    }

    const byte = await file.arrayBuffer();
    const buffer = Buffer.from(byte);

    console.log(name, description, price, category);

    const response = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: "product" },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(buffer);
    });

    const product = await Product.create({
      name,
      description,
      price,
      category,
      picture: response.public_id,
    });
    return NextResponse.json({ product: product });
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}
