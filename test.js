const numbers = [1, 2, 3, 4, 5];

// 👉 Yêu cầu:
/// a. Tạo mảng mới chứa các số gấp đôi
/// b. Tạo mảng mới chứa chuỗi "Số: x" với mỗi phần tử


const new_number = numbers.map(n => n*2); 
console.log(new_number); 


const add_ten_number = numbers.map(item => item + 10); 
console.log(add_ten_number); 


const new2 = numbers.map(n => `Xin chao: ${n}`); 

console.log(new2); 


const orders = [
  { id: 1, items: ["🍣", "🍜"] },
  { id: 2, items: ["🍔"] },
  { id: 3, items: ["🥗", "🍕", "🍟"] }
];

// Yêu cầu:
/// a. Tạo 1 mảng chứa tất cả các món ăn đã order (flatten array)

const orders_array = orders.flatMap(order => order.items); 
console.log(orders_array)

const product = {
  name: "Trà sữa",
  variantProducts: [
    {
      variant_id: 1,
      price: 30000,
      variant: {
        name: "S",
        reviews: [{ rating_star: 4 }, { rating_star: 5 }]
      }
    },
    {
      variant_id: 2,
      price: 35000,
      variant: {
        name: "M",
        reviews: [{ rating_star: 3 }]
      }
    }
  ]
};

// 👉 Yêu cầu:
/// a. Lấy danh sách variant gồm: id, name, price
/// b. Tính điểm rating trung bình của toàn sản phẩm

// [{1,3000, S}, {2,M,35000}]
// arrow , phải để trong ngoặc tròn 
const needs = product['variantProducts'].flatMap(variantItem => ({id: variantItem.variant_id, name: variantItem.variant.name, price: variantItem.price})) 
console.log(needs); 



const numbers_2 = [2, 4, 6, 8];
// 👉 Tạo mảng mới: [4, 8, 12, 16]

console.log(numbers_2.map(x => x*2)) ; 

const names = ["Sushi", "Ramen", "Matcha"];
// 👉 Tạo mảng: ["Món: Sushi", "Món: Ramen", "Món: Matcha"]
console.log(names.map( n => `Món: ${n}`)); 

const menu = [
  { id: 1, name: "Sushi", price: 120000 },
  { id: 2, name: "Ramen", price: 90000 }
];
// Trả về mảng tên món: ["Sushi", "Ramen"]

console.log(menu.flatMap(obj => obj.name)); 

const items = [
  { id: 1, name: "Trà sữa", price: 30000, discount: 28000 },
  { id: 2, name: "Matcha", price: 35000, discount: 32000 }
];
// Trả về: [{ name: "Trà sữa", finalPrice: 28000 }, ...]

console.log('----------------'); 
console.log(items.flatMap(obj => ({name: obj.name, finalPrice: obj.price - obj.discount}))); 




