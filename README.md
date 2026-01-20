Import library: 

```
npm install express sequelize pg pg-hstore cors jsonwebtoken bcryptjs --save

```


Tại sao cần dùng cors trong Node.js?

Cho phép client ở domain khác gọi API

Nếu frontend (React/Vue/Angular...) chạy trên http://localhost:3000

Backend (Node.js/Express) chạy trên http://localhost:5000

→ Trình duyệt sẽ chặn request nếu backend không bật CORS.



Rất hay, mình sẽ giúp bạn liệt kê **toàn bộ các RESTful API endpoint cho ứng dụng thương mại điện tử (e-commerce)** đầy đủ mọi khía cạnh — **phù hợp với mobile app**, có phân rõ **cái nào cần access token và cái nào không cần**.

---

## 🧭 CÁCH PHÂN LOẠI
- ✅: **Không cần access token** (public, guest có thể truy cập)
- 🔒: **Cần access token** (phải login mới dùng được, cần xác thực)

---

## 🔐 1. AUTHENTICATION (Đăng nhập / Đăng ký / Token)
| Method | Endpoint | Mô tả | Token |
|--------|----------|-------|--------|
| POST   | `/api/auth/register`       | Đăng ký tài khoản | ✅ |
| POST   | `/api/auth/login`          | Đăng nhập, trả accessToken + refreshToken | ✅ |
| POST   | `/api/auth/refresh-token`  | Làm mới accessToken từ refreshToken | ✅ |
| POST   | `/api/auth/logout`         | Đăng xuất, xóa refreshToken khỏi DB | 🔒 |
| GET    | `/api/auth/profile`        | Lấy thông tin user hiện tại | 🔒 |
| PUT    | `/api/auth/profile`        | Cập nhật thông tin user | 🔒 |
| POST   | `/api/auth/change-password`| Đổi mật khẩu | 🔒 |
| POST   | `/api/auth/send-otp`       | Gửi mã OTP quên mật khẩu | ✅ |
| POST   | `/api/auth/verify-otp`     | Xác thực mã OTP | ✅ |
| POST   | `/api/auth/reset-password` | Reset mật khẩu | ✅ |

---

## 👤 2. USER & ROLE
| Method | Endpoint | Mô tả | Token |
|--------|----------|-------|--------|
| GET    | `/api/users`              | (Admin) Danh sách user | 🔒 (Admin) |
| GET    | `/api/users/{id}`         | Thông tin user theo ID | 🔒 |
| PUT    | `/api/users/{id}`         | Cập nhật user (Admin/User) | 🔒 |
| DELETE | `/api/users/{id}`         | Xoá user | 🔒 (Admin) |

---

## 🛍️ 3. PRODUCT (Sản phẩm)
| Method | Endpoint | Mô tả | Token |
|--------|----------|-------|--------|
| GET    | `/api/products`            | Danh sách sản phẩm (có lọc, tìm kiếm, phân trang) | ✅ |
| GET    | `/api/products/{id}`       | Xem chi tiết sản phẩm | ✅ |
| POST   | `/api/products`            | Thêm sản phẩm mới (Admin) | 🔒 (Admin) |
| PUT    | `/api/products/{id}`       | Cập nhật sản phẩm (Admin) | 🔒 (Admin) |
| DELETE | `/api/products/{id}`       | Xoá sản phẩm (Admin) | 🔒 (Admin) |

---

## 🏷️ 4. CATEGORY / TAGS
| Method | Endpoint | Mô tả | Token |
|--------|----------|-------|--------|
| GET    | `/api/categories`          | Lấy danh sách danh mục | ✅ |
| GET    | `/api/categories/{id}`     | Chi tiết danh mục | ✅ |
| POST   | `/api/categories`          | Thêm danh mục (Admin) | 🔒 (Admin) |
| PUT    | `/api/categories/{id}`     | Sửa danh mục (Admin) | 🔒 (Admin) |
| DELETE | `/api/categories/{id}`     | Xoá danh mục (Admin) | 🔒 (Admin) |

---

## 🛒 5. CART (Giỏ hàng)
| Method | Endpoint | Mô tả | Token |
|--------|----------|-------|--------|
| GET    | `/api/cart`                | Xem giỏ hàng của người dùng | 🔒 |
| POST   | `/api/cart`                | Thêm sản phẩm vào giỏ | 🔒 |
| PUT    | `/api/cart/{itemId}`       | Cập nhật số lượng | 🔒 |
| DELETE | `/api/cart/{itemId}`       | Xoá sản phẩm khỏi giỏ | 🔒 |
| DELETE | `/api/cart/clear`          | Xoá toàn bộ giỏ | 🔒 |

---

## 💳 6. CHECKOUT / ORDER (Đặt hàng)
| Method | Endpoint | Mô tả | Token |
|--------|----------|-------|--------|
| POST   | `/api/orders`              | Tạo đơn hàng từ giỏ hàng | 🔒 |
| GET    | `/api/orders`              | Lịch sử đơn hàng của user | 🔒 |
| GET    | `/api/orders/{id}`         | Chi tiết đơn hàng | 🔒 |
| PUT    | `/api/orders/{id}/cancel`  | Hủy đơn hàng | 🔒 |
| PUT    | `/api/orders/{id}/status`  | Cập nhật trạng thái (Admin) | 🔒 (Admin) |
| GET    | `/api/orders/admin`        | (Admin) Xem tất cả đơn hàng | 🔒 (Admin) |

---

## 🚚 7. SHIPPING & PAYMENT
| Method | Endpoint | Mô tả | Token |
|--------|----------|-------|--------|
| GET    | `/api/shipping-methods`    | Danh sách phương thức giao hàng | ✅ |
| GET    | `/api/payment-methods`     | Danh sách phương thức thanh toán | ✅ |
| POST   | `/api/payments`            | Tạo giao dịch thanh toán | 🔒 |

---

## ⭐ 8. REVIEW / RATING
| Method | Endpoint | Mô tả | Token |
|--------|----------|-------|--------|
| GET    | `/api/products/{id}/reviews` | Lấy danh sách đánh giá sản phẩm | ✅ |
| POST   | `/api/products/{id}/reviews` | Viết đánh giá sản phẩm | 🔒 |
| PUT    | `/api/reviews/{id}`          | Cập nhật đánh giá | 🔒 |
| DELETE | `/api/reviews/{id}`          | Xoá đánh giá | 🔒 |

---

## ❤️ 9. WISHLIST / FAVORITE
| Method | Endpoint | Mô tả | Token |
|--------|----------|-------|--------|
| GET    | `/api/wishlist`           | Lấy danh sách yêu thích | 🔒 |
| POST   | `/api/wishlist`           | Thêm sản phẩm vào yêu thích | 🔒 |
| DELETE | `/api/wishlist/{productId}` | Xoá khỏi yêu thích | 🔒 |

---

## 📦 10. ADMIN DASHBOARD (thống kê, quản trị)
| Method | Endpoint | Mô tả | Token |
|--------|----------|-------|--------|
| GET    | `/api/admin/summary`       | Tổng quan hệ thống (doanh thu, đơn hàng, user) | 🔒 (Admin) |
| GET    | `/api/admin/top-products`  | Sản phẩm bán chạy | 🔒 (Admin) |
| GET    | `/api/admin/sales-report`  | Báo cáo doanh số | 🔒 (Admin) |

---

## 🔔 11. NOTIFICATIONS (Thông báo)
| Method | Endpoint | Mô tả | Token |
|--------|----------|-------|--------|
| GET    | `/api/notifications`       | Danh sách thông báo | 🔒 |
| PUT    | `/api/notifications/{id}/read` | Đánh dấu đã đọc | 🔒 |

---

## 📄 12. SETTINGS / CONTENT (Trang CMS, chính sách,...)
| Method | Endpoint | Mô tả | Token |
|--------|----------|-------|--------|
| GET    | `/api/pages/about`         | Trang giới thiệu | ✅ |
| GET    | `/api/pages/policy`        | Chính sách mua hàng | ✅ |
| GET    | `/api/pages/contact`       | Liên hệ | ✅ |

---

## 🛠️ 13. FILE UPLOAD (Avatar, ảnh sản phẩm)
| Method | Endpoint | Mô tả | Token |
|--------|----------|-------|--------|
| POST   | `/api/upload/avatar`       | Upload avatar user | 🔒 |
| POST   | `/api/upload/product-image`| Upload ảnh sản phẩm | 🔒 (Admin) |

---

Nếu bạn cần mình tạo **Postman Collection mẫu** hoặc **Swagger/OpenAPI** cho các endpoint trên, mình cũng có thể làm giúp nhé.

Bạn muốn mình bắt đầu với module nào trước? Hay bạn đang dùng Node.js, Spring Boot, hay framework nào để mình hướng dẫn đúng chuẩn?

