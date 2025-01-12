-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jan 12, 2025 at 03:45 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `mymarketu_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `cart`
--

CREATE TABLE `cart` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `total_amount` decimal(10,2) NOT NULL,
  `status` enum('pending','processing','completed','cancelled') DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `orders`
--

INSERT INTO `orders` (`id`, `user_id`, `total_amount`, `status`, `created_at`) VALUES
(5, 5, 25000.00, 'pending', '2025-01-10 07:15:31'),
(6, 5, 52000.00, 'pending', '2025-01-10 10:11:02'),
(7, 5, 96600.00, 'completed', '2025-01-10 11:11:28'),
(8, 7, 30000.00, 'completed', '2025-01-10 12:23:53');

-- --------------------------------------------------------

--
-- Table structure for table `order_items`
--

CREATE TABLE `order_items` (
  `id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL,
  `price` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `order_items`
--

INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `quantity`, `price`) VALUES
(7, 5, 108, 1, 25000.00),
(8, 6, 114, 1, 10000.00),
(9, 6, 109, 3, 6000.00),
(10, 6, 98, 2, 12000.00),
(11, 7, 114, 1, 10000.00),
(12, 7, 106, 2, 10800.00),
(13, 7, 107, 3, 7000.00),
(14, 7, 105, 2, 22000.00),
(15, 8, 114, 3, 10000.00);

-- --------------------------------------------------------

--
-- Table structure for table `products`
--

CREATE TABLE `products` (
  `id` int(11) NOT NULL,
  `nama` varchar(100) NOT NULL,
  `kategori` varchar(50) DEFAULT NULL,
  `harga` decimal(10,2) NOT NULL,
  `stok` int(11) NOT NULL DEFAULT 0,
  `deskripsi` text DEFAULT NULL,
  `namaFileGambar` varchar(255) DEFAULT NULL,
  `diskon` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `products`
--

INSERT INTO `products` (`id`, `nama`, `kategori`, `harga`, `stok`, `deskripsi`, `namaFileGambar`, `diskon`, `created_at`) VALUES
(94, 'Fanta', 'Minuman', 10000.00, 50, 'Minuman segar Fanta', '1734287624304_fanta.jpg', 0, '2025-01-09 14:56:03'),
(95, 'Almond', 'Makanan', 50000.00, 20, 'Kacang almond berkualitas', '1734352675209_meijialmond.jpg', 0, '2025-01-09 14:56:03'),
(96, 'Scotch', 'Kebutuhan', 30000.00, 15, 'Scotch tape premium', '1735740499968_skibididsihdaisd.jpg', 90, '2025-01-09 14:56:03'),
(97, 'Bango Manis', 'Makanan', 25000.00, 40, 'Kecap manis Bango', 'bango_kecap_manis.jpg', 0, '2025-01-09 14:56:03'),
(98, 'Chitato', 'Makanan', 12000.00, 28, 'Keripik kentang Chitato', 'chitato_sapi_panggang.jpg', 0, '2025-01-09 14:56:03'),
(99, 'Fruit Tea', 'Minuman', 8000.00, 60, 'Minuman teh rasa blackcurrant', 'fruit_tea_blackcurrant.jpg', 0, '2025-01-09 14:56:03'),
(100, 'Indomilk', 'Minuman', 15000.00, 35, 'Susu kental manis Indomilk', 'indomilk_kental_manis.jpg', 90, '2025-01-09 14:56:03'),
(101, 'Kapal Api', 'Makanan', 18000.00, 25, 'Kopi bubuk Kapal Api', 'kapal_api_kopi_bubuk.jpg', 20, '2025-01-09 14:56:03'),
(102, 'Melon Segar', 'Makanan', 20000.00, 10, 'Buah melon segar', 'melon_segar.jpg', 0, '2025-01-09 14:56:03'),
(103, 'Mister Potato', 'Makanan', 15000.00, 30, 'Keripik kentang Mister Potato', 'mister_potato_original.jpg', 90, '2025-01-09 14:56:03'),
(104, 'Onigiri Salmon', 'Makanan', 25000.00, 15, 'Onigiri isi salmon', 'onigiri_salmon_krimi.jpg', 90, '2025-01-09 14:56:03'),
(105, 'Pisang Cavendish', 'Makanan', 22000.00, 18, 'Pisang segar Cavendish', 'pisang_cavendish.jpg', 0, '2025-01-09 14:56:03'),
(106, 'Tisu Wajah', 'Kebutuhan', 12000.00, 48, 'Tisu wajah Nice', 'tisu_wajah.jpg', 10, '2025-01-09 14:56:03'),
(107, 'Teh Pucuk', 'Minuman', 7000.00, 47, 'Teh kemasan segar Pucuk Harum', 'tehpucuk.jpg', 0, '2025-01-09 15:06:28'),
(108, 'Arizona Ice Tea', 'Minuman', 25000.00, 29, 'Minuman teh Arizona Ice Tea', 'arizona-icetea.jpg', 0, '2025-01-09 15:06:28'),
(109, 'Teh Kotak', 'Minuman', 6000.00, 37, 'Teh dalam kemasan kotak', 'tehkotak.jpg', 0, '2025-01-09 15:06:28'),
(110, 'Penghapus Staedtler', 'Kebutuhan', 5000.00, 60, 'Penghapus berkualitas dari Staedtler', 'penghapus_staedtler.jpg', 0, '2025-01-09 15:06:28'),
(111, 'Zebra Sarasa', 'Kebutuhan', 12000.00, 25, 'Pulpen Zebra Sarasa premium', 'ZEBRA_SARASA.jpg', 0, '2025-01-09 15:06:28'),
(112, 'Sabun Lifebuoy', 'Kebutuhan', 12000.00, 40, 'Sabun kesehatan Lifebuoy', 'sabun_lifebouy.jpg', 0, '2025-01-09 15:34:32'),
(113, 'Pepsodent', 'Kebutuhan', 15000.00, 35, 'Pasta gigi Pepsodent untuk perlindungan gigi', 'pepsodent.jpg', 0, '2025-01-09 15:34:32'),
(114, 'Sikat Gigi Formula', 'Kebutuhan', 10000.00, 45, 'Sikat gigi Formula lembut dan efektif', 'sikatgigiformula.jpg', 0, '2025-01-09 15:34:32');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `full_name` varchar(100) DEFAULT NULL,
  `phone` varchar(15) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `role` enum('admin','customer') DEFAULT 'customer',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `status` enum('active','inactive') DEFAULT 'active'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `email`, `password`, `full_name`, `phone`, `address`, `role`, `created_at`, `status`) VALUES
(1, 'admin', 'admin@mymarketu.com', 'hashedpassword123', 'Admin MyMarketU', NULL, NULL, 'admin', '2025-01-03 04:06:27', 'active'),
(5, 'john_doe', 'john@example.com', 'john123', NULL, NULL, NULL, 'customer', '2025-01-03 04:20:34', 'active'),
(6, 'jane_doe', 'jane@example.com', 'jane123', NULL, NULL, NULL, 'customer', '2025-01-03 04:20:34', 'active'),
(7, 'janedoe', 'customer@customer.com', 'customer123', NULL, NULL, NULL, 'customer', '2025-01-10 12:22:59', 'active'),
(8, 'Super Admin', 'admin@example.com', 'admin123', 'admin super', '0000000000', '-', 'admin', '2025-01-12 14:45:25', 'active');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `cart`
--
ALTER TABLE `cart`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `product_id` (`product_id`);

--
-- Indexes for table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `order_items`
--
ALTER TABLE `order_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `order_id` (`order_id`),
  ADD KEY `product_id` (`product_id`);

--
-- Indexes for table `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `cart`
--
ALTER TABLE `cart`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `order_items`
--
ALTER TABLE `order_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `products`
--
ALTER TABLE `products`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=117;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `cart`
--
ALTER TABLE `cart`
  ADD CONSTRAINT `cart_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `cart_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`);

--
-- Constraints for table `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `order_items`
--
ALTER TABLE `order_items`
  ADD CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`),
  ADD CONSTRAINT `order_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
