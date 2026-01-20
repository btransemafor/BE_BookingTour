const { fn, col } = require("sequelize");
const { db } = require("./models/index");



const calculateRating = async(product_id) => {
  const pro = await db.product.findOne({
    where: { id: product_id }, // Fixed to use the parameter instead of hardcoded value
    attributes: [
      "id",
      "name_product",
      "description",
      "soldQuantity",
      "stockQuantity",
      "imageUrl",
      "discount_percent",
      "category_id",
    ],
    include: [
      {
        model: db.variantProduct,
        as: "variantProducts",
        include: [
          {
            model: db.variant,
            as: "variant",
            include: [
              {
                model: db.order_line,
                as: "orderLines",
                required: false,
                attributes: ["id", "variant_id", "product_id"],
                where: { product_id: product_id }, // Chỉ lấy order_line của sản phẩm hiện tại
                include: [
                  {
                    required: false,
                    model: db.review,
                    as: "review",
                    attributes: ["rating_star", "comment", "review_date"],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  });

  // Log chi tiết các reviews trước khi tính trung bình
  let allReviews = [];
  pro.variantProducts.forEach((vp, vpIndex) => {
    console.log(`Kiểm tra variantProduct #${vpIndex + 1}, variant_id: ${vp.variant_id}`);
    
    if (vp.variant && vp.variant.orderLines) {
      vp.variant.orderLines.forEach((ol, olIndex) => {
        console.log(`  OrderLine #${olIndex + 1}, ID: ${ol.id}`);
        
        if (ol.review) {
          console.log(`    Review found: ID=${ol.review.id}, Rating=${ol.review.rating_star}`);
          if (ol.review.rating_star !== null) {
            allReviews.push(ol.review);
          }
        } else {
          console.log(`    Không có review cho order_line này`);
        }
      });
    } else {
      console.log(`  Không có orderLines cho variant này`);
    }
  });

  
  // Kiểm tra và in từng đánh giá
  if (allReviews.length > 0) {
    allReviews.forEach((r, index) => {
      console.log(`Review #${index + 1}: rating_star = ${r.rating_star}`);
    });
  }

  // Tính trung bình rating
  const averageRating =
    allReviews.length > 0
      ? (
          allReviews.reduce((sum, r) => sum + r.rating_star, 0) /
          allReviews.length
        ).toFixed(2)
      : 0; // Trả về 0 thay vì null nếu không có đánh giá
        return averageRating; 
}
const getProduct = async () => {
  try {
    const pro = await db.product.findAll({
      where: { category_id: 1 },
      attributes: [
        "id",
        "name_product",
        "description",
        "soldQuantity",
        "stockQuantity",
        "imageUrl",
        "discount_percent",
        "category_id",
      ],
      include: [
        {
          model: db.variantProduct,
          as: "variantProducts",
          include: [
            {
              model: db.variant,
              as: "variant",
              include: [
                {
                  model: db.order_line,
                  as: "orderLines",
                  required: false, // Thay đổi từ true thành false để không bỏ qua các variant không có đơn hàng
                  attributes: ["id", "variant_id", "product_id"],
                  include: [
                    {
                      required: false, // Thay đổi từ true thành false
                      model: db.review,
                      as: "review",
                      attributes: ["rating_star", "comment", "review_date"],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    });

    if (!pro) {
      console.log("Không tìm thấy sản phẩm");
      return null;
    }

    // Lấy hết tất cả review của các variant của sản phẩm
    const allReviews = pro.variantProducts.flatMap((vp) =>
      (vp.variant?.orderLines || [])
        .map((ol) => ol.review)
        .filter((r) => r && r.rating_star !== null)
    );

    // Tính trung bình rating
    const averageRating =
      allReviews.length > 0
        ? (
            allReviews.reduce((sum, r) => sum + r.rating_star, 0) /
            allReviews.length
          ).toFixed(2)
        : null;

    const result = {
      ...pro.toJSON(),
      averageRating,
    };

    console.log("Loại của result:", typeof result);

    console.log(JSON.stringify(result, null, 2));

    const productName = pro.name_product;
    console.log("Tên sản phẩm:", productName);

    // Chuẩn hóa thông tin variant
    let variants = [];
    pro.variantProducts.forEach((item) => {
      const id = item.variant_id;
      const name_variant = item.variant?.variant_name || "Unknown";
      const price = item.price;
      const discount_price = item.discount_price;
      variants.push({
        id: id,
        name_variant: name_variant,
        price: price,
        discount_price: discount_price,
      });
    });

    console.log("Variants:", variants);

    // Tạo đối tượng product_detail hoàn chỉnh
    const product_detail = {
      id: pro.id,
      name: pro.name_product,
      description: pro.description,
      soldQuantity: pro.soldQuantity || 0,
      stockQuantity: pro.stockQuantity || 0,
      imageUrl: pro.imageUrl,
      discount_percent: pro.discount_percent,
      category_id: pro.category_id,
      rating_star: averageRating, // Fixed: averageRating thay vì averagerating
      variants: variants,
    };

    console.log(JSON.stringify(product_detail, null, 2));
    return product_detail;
  } catch (error) {
    console.error("Lỗi khi lấy chi tiết sản phẩm:", error);
    return null;
  }
};

getProduct(); 