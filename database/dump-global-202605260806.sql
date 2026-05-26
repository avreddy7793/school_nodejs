-- MySQL dump 10.13  Distrib 8.0.19, for Win64 (x86_64)
--
-- Host: localhost    Database: global
-- ------------------------------------------------------
-- Server version	9.1.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `account`
--

DROP TABLE IF EXISTS `account`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `account` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(100) DEFAULT NULL,
  `description` varchar(300) DEFAULT NULL,
  `create_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `update_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `opening_balance` int DEFAULT NULL,
  `client_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `account_FK` (`client_id`),
  CONSTRAINT `account_FK` FOREIGN KEY (`client_id`) REFERENCES `client_master` (`client_id`)
) ENGINE=InnoDB AUTO_INCREMENT=78 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `account`
--

LOCK TABLES `account` WRITE;
/*!40000 ALTER TABLE `account` DISABLE KEYS */;
INSERT INTO `account` VALUES (48,'CASH','CASH','2024-03-24 17:57:04','2025-06-20 02:53:33',40500,19),(49,'BANK AMOUNT','BANK ACCOUNT','2024-03-24 17:57:04','2024-03-24 17:57:04',0,19),(50,'UPI','UPI','2024-03-24 17:57:04','2024-03-24 17:57:04',0,19),(51,'CREDITS','CREDITS','2024-03-24 17:57:04','2024-03-24 17:57:04',0,19),(52,'DENTORS','DENTORS','2024-03-24 17:57:04','2024-03-24 17:57:04',0,19),(53,'CASH','CASH','2024-08-21 03:23:09','2024-08-21 03:23:09',0,20),(54,'BANK AMOUNT','BANK ACCOUNT','2024-08-21 03:23:09','2024-08-21 03:23:09',0,20),(55,'UPI','UPI','2024-08-21 03:23:09','2024-08-21 03:23:09',0,20),(56,'CREDITS','CREDITS','2024-08-21 03:23:09','2024-08-21 03:23:09',0,20),(57,'DENTORS','DENTORS','2024-08-21 03:23:09','2024-08-21 03:23:09',0,20),(58,'CASH','CASH','2024-09-18 10:22:56','2024-09-23 14:57:59',750,21),(59,'BANK AMOUNT','BANK ACCOUNT','2024-09-18 10:22:56','2024-12-15 09:43:48',600,21),(60,'UPI','UPI','2024-09-18 10:22:56','2024-12-23 09:56:03',1060,21),(61,'CREDITS','CREDITS','2024-09-18 10:22:56','2024-09-23 14:59:28',142,21),(62,'DENTORS','DENTORS','2024-09-18 10:22:56','2024-09-18 10:22:56',0,21),(63,'CASH','CASH','2024-10-22 11:46:16','2024-10-22 11:46:16',0,22),(64,'BANK AMOUNT','BANK ACCOUNT','2024-10-22 11:46:16','2024-10-22 11:46:16',0,22),(65,'UPI','UPI','2024-10-22 11:46:16','2024-10-22 11:46:16',0,22),(66,'CREDITS','CREDITS','2024-10-22 11:46:16','2024-10-22 11:46:16',0,22),(67,'DENTORS','DENTORS','2024-10-22 11:46:16','2024-10-22 11:46:16',0,22),(68,'CASH','CASH','2024-12-08 05:39:26','2024-12-08 05:39:26',0,23),(69,'BANK AMOUNT','BANK ACCOUNT','2024-12-08 05:39:26','2024-12-08 05:39:26',0,23),(70,'UPI','UPI','2024-12-08 05:39:26','2024-12-08 05:39:26',0,23),(71,'CREDITS','CREDITS','2024-12-08 05:39:26','2024-12-08 05:39:26',0,23),(72,'DENTORS','DENTORS','2024-12-08 05:39:26','2024-12-08 05:39:26',0,23),(73,'CASH','CASH','2025-05-30 08:25:25','2025-05-30 08:25:25',0,24),(74,'BANK AMOUNT','BANK ACCOUNT','2025-05-30 08:25:25','2025-05-30 08:25:25',0,24),(75,'UPI','UPI','2025-05-30 08:25:25','2025-05-30 08:25:25',0,24),(76,'DENTORS','DENTORS','2025-05-30 08:25:25','2025-05-30 08:25:25',0,24),(77,'CREDITS','CREDITS','2025-05-30 08:25:25','2025-05-30 08:25:25',0,24);
/*!40000 ALTER TABLE `account` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bankdetails`
--

DROP TABLE IF EXISTS `bankdetails`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bankdetails` (
  `id` bigint NOT NULL,
  `client_id` bigint DEFAULT NULL,
  `Account_Number` varchar(100) DEFAULT NULL,
  `IFSC_Code` varchar(100) DEFAULT NULL,
  `Bank_Branch_Name` varchar(100) DEFAULT NULL,
  `Account_Holders_Name` varchar(100) DEFAULT NULL,
  `UPI_ID` varchar(100) DEFAULT NULL,
  `create_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `update_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` bigint DEFAULT NULL,
  `UPI_Code` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `bankdetails_FK` (`client_id`),
  KEY `bankdetails_FK_1` (`created_by`),
  CONSTRAINT `bankdetails_FK` FOREIGN KEY (`client_id`) REFERENCES `client_master` (`client_id`),
  CONSTRAINT `bankdetails_FK_1` FOREIGN KEY (`created_by`) REFERENCES `employess` (`emp_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bankdetails`
--

LOCK TABLES `bankdetails` WRITE;
/*!40000 ALTER TABLE `bankdetails` DISABLE KEYS */;
/*!40000 ALTER TABLE `bankdetails` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `branch`
--

DROP TABLE IF EXISTS `branch`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `branch` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `client_id` bigint DEFAULT NULL,
  `branch_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `branch_code` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `branch_mail` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `branch_manager` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `branch_address` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `phone_number` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `description` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `status` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `create_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `update_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` bigint DEFAULT NULL,
  `manager` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `branch_FK` (`client_id`),
  KEY `branch_FK_1` (`created_by`),
  KEY `branch_FK_2` (`manager`),
  CONSTRAINT `branch_FK` FOREIGN KEY (`client_id`) REFERENCES `client_master` (`client_id`),
  CONSTRAINT `branch_FK_1` FOREIGN KEY (`created_by`) REFERENCES `employess` (`emp_id`),
  CONSTRAINT `branch_FK_2` FOREIGN KEY (`manager`) REFERENCES `employess` (`emp_id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `branch`
--

LOCK TABLES `branch` WRITE;
/*!40000 ALTER TABLE `branch` DISABLE KEYS */;
/*!40000 ALTER TABLE `branch` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `client_category`
--

DROP TABLE IF EXISTS `client_category`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `client_category` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `create_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `update_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `client_category`
--

LOCK TABLES `client_category` WRITE;
/*!40000 ALTER TABLE `client_category` DISABLE KEYS */;
INSERT INTO `client_category` VALUES (1,'HEAD','2022-10-12 04:16:05','2023-09-27 08:10:47'),(2,'SHOPPING','2022-10-11 13:46:06','2023-06-05 11:17:27'),(3,'SCHOOL','2022-10-11 13:46:16','2022-10-11 13:46:16'),(4,'SPORTS','2022-10-12 04:16:05','2023-03-16 03:25:10'),(5,'E-COMMERS','2023-05-15 07:12:48','2023-05-15 07:12:48'),(6,'PG','2023-10-06 08:09:01','2023-10-06 08:09:01'),(7,'OPTICAL','2024-02-29 03:34:56','2024-12-23 11:01:08'),(8,'MILK','2024-08-20 14:49:01','2024-10-22 11:44:39'),(9,'FINANCIAL','2025-05-30 08:23:39','2025-05-30 08:23:39');
/*!40000 ALTER TABLE `client_category` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `client_master`
--

DROP TABLE IF EXISTS `client_master`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `client_master` (
  `client_id` bigint NOT NULL AUTO_INCREMENT,
  `client_name` varchar(100) DEFAULT NULL,
  `create_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `update_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `client_address` varchar(100) DEFAULT NULL,
  `category` bigint DEFAULT NULL,
  `img` varchar(5000) DEFAULT NULL,
  `owner_name` varchar(100) DEFAULT NULL,
  `mobile_number` varchar(100) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `created_by` bigint DEFAULT NULL,
  `gdt_number` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`client_id`),
  KEY `client_master_FK` (`category`),
  CONSTRAINT `client_master_FK` FOREIGN KEY (`category`) REFERENCES `client_category` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `client_master`
--

LOCK TABLES `client_master` WRITE;
/*!40000 ALTER TABLE `client_master` DISABLE KEYS */;
INSERT INTO `client_master` VALUES (1,'AVR GROUPS','2022-10-12 04:17:16','2024-01-03 02:21:09','DARSI',1,'https://oceanbill.s3.ap-south-1.amazonaws.com/logo.png','VENKATA REDDY','9966336638','AVREDDY.SMILE@ICLOUD.COM',NULL,NULL),(19,'SLV PG FOR MEN\'S','2024-03-24 17:57:02','2024-03-24 18:25:04','KUNDHANAHALLI',6,'https://img.staticmb.com/mbphoto/pg/grd1/cropped_images/2020/Feb/19/Photo_h400_w540/GR1-1728-276729_400_540.jpg','BHAGYA LAKSHMI','9966336638','BHAGYALAKSHMI007@GMAIL.COM',88,NULL),(20,'NEW VISION OPRICALS','2024-08-21 03:23:07','2024-12-23 11:21:49','KPHB Coloney',7,'https://www.mpl.live/blog/wp-content/uploads/2024/06/Pure-Sequence-in-Rummy.png.webp','RAMI REDDY','9966336638','newvisionopticalskphb@gmail.co',88,'36AEVPN9064J1ZL'),(21,'NANNI OPTICALS','2024-09-18 10:22:54','2024-09-19 11:03:41','KPHB Coloney',2,'https://content3.jdmagicbox.com/comp/def_content_category/sunglass-dealers-rayban/sunglass-dealers-rayban-daddy-o-sunglass-dealers-rayban-2-x7xfh.jpg','VEERU','9638527410','veerunanni@gmail.com',88,NULL),(22,'SREVEN','2024-10-22 11:46:14','2024-10-22 11:49:51','HYDERABAD',8,'https://w7.pngwing.com/pngs/600/735/png-transparent-coffee-milk-milk-bottle-milk-thumbnail.png','SREEDEVI','8341897793','',88,NULL),(23,'SRI VIVEKANDA HIGH SCHOOL','2024-12-08 05:39:24','2024-12-08 05:42:06','DARSI',3,'https://media.istockphoto.com/id/1480246301/vector/vector-illustration-of-high-school-building-vector-school-building.jpg?s=612x612&w=0&k=20&c=vR6dixHuh8Ypw1c3pjR-7ahN2V1vhCKxxTzDd7HlVbY=','RAMANJI','7894561230','srivivekandhahighschooldarsi@gmail.com',88,NULL),(24,'VIJAY REDDY','2025-05-30 08:25:23','2025-05-30 10:30:47','HYDERABAD',9,'https://cdn.vectorstock.com/i/2000v/91/46/finance-logo-design-vector-54269146.webp','VIJAY REDDY','9638527410','vijay',88,NULL);
/*!40000 ALTER TABLE `client_master` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `employess`
--

DROP TABLE IF EXISTS `employess`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employess` (
  `emp_id` bigint NOT NULL AUTO_INCREMENT,
  `emp_name` varchar(100) DEFAULT NULL,
  `emp_designation` varchar(100) DEFAULT NULL,
  `emp_type` varchar(100) DEFAULT NULL,
  `client_id` bigint DEFAULT NULL,
  `create_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `update_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `email` varchar(100) NOT NULL,
  `status` varchar(100) DEFAULT NULL,
  `category` bigint DEFAULT NULL,
  `phone_number` varchar(100) DEFAULT NULL,
  `department` varchar(100) DEFAULT NULL,
  `created_by` bigint DEFAULT NULL,
  `role` bigint DEFAULT NULL,
  `images` varchar(5000) DEFAULT NULL,
  PRIMARY KEY (`emp_id`),
  KEY `employess_FK` (`client_id`),
  KEY `employess_FK_1` (`category`),
  KEY `employess_FK_2` (`created_by`),
  KEY `employess_FK_3` (`role`),
  CONSTRAINT `employess_FK` FOREIGN KEY (`client_id`) REFERENCES `client_master` (`client_id`),
  CONSTRAINT `employess_FK_1` FOREIGN KEY (`category`) REFERENCES `client_category` (`id`),
  CONSTRAINT `employess_FK_3` FOREIGN KEY (`role`) REFERENCES `roles` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=128 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employess`
--

LOCK TABLES `employess` WRITE;
/*!40000 ALTER TABLE `employess` DISABLE KEYS */;
INSERT INTO `employess` VALUES (88,'teamtrack','SUPERADMIN','INTERNAL',1,'2022-12-21 03:19:36','2023-09-27 08:11:46','venkatreddybd@gmail.com','ACTIVATED',1,'9966336638','Master',NULL,1,'https://image.shutterstock.com/mosaic_250/2780032/1194497251/stock-photo-portrait-of-smiling-red-haired-millennial-man-looking-at-camera-sitting-in-caf-or-coffeeshop-1194497251.jpg'),(120,'slv-admin','MASTER','INTERNAL',19,'2024-03-24 17:58:03','2024-03-24 17:59:31','slv-admin','ACTIVATED',6,'8341897793','Others',88,2,NULL),(121,'jvvadmin','ADMIN','INTERNAL',20,'2024-08-21 03:24:08','2024-08-21 03:25:14','jvvadmin@gmail.com','ACTIVATED',8,'9966336638','',88,2,NULL),(122,'nanni','OWNER','INTERNAL',21,'2024-09-18 10:23:40','2024-09-18 10:24:07','nanni','ACTIVATED',2,'9638527410','Administrator',88,3,NULL),(123,'SURYA KUMAR','LAB INCHARGE','INTERNAL',21,'2024-09-23 15:53:31','2024-09-24 06:25:23','lab1','ACTIVATED',2,'9876543210','Purchase',122,6,NULL),(124,'sreedevi','ADMIN','INTERNAL',22,'2024-10-22 11:46:54','2024-10-22 11:47:42','sreedevi','ACTIVATED',8,'8341897793','',88,1,NULL),(125,'svh-admin','ADMIN','INTERNAL',23,'2024-12-08 05:40:34','2024-12-08 05:41:06','svhadmin@gmail.com','ACTIVATED',3,'7894561230','Administrator',88,3,NULL),(126,'ramireddy','ADMINISTRATOR','INTERNAL',20,'2024-12-23 11:04:09','2024-12-23 11:04:29','','ACTIVATED',7,'6303737517','Administrator',88,1,NULL),(127,'vijay','Admin','INTERNAL',24,'2025-05-30 08:26:22','2025-05-30 08:27:08','vijay','ACTIVATED',9,'9638527410','',88,1,NULL);
/*!40000 ALTER TABLE `employess` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `expense_category`
--

DROP TABLE IF EXISTS `expense_category`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `expense_category` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `create_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `update_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `category_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `expense_category`
--

LOCK TABLES `expense_category` WRITE;
/*!40000 ALTER TABLE `expense_category` DISABLE KEYS */;
INSERT INTO `expense_category` VALUES (1,'2022-11-20 04:25:58','2022-11-20 04:25:58','Bank Fee and Charges '),(2,'2022-11-20 04:26:20','2022-11-20 04:26:20','Employee Salaries & Advances '),(3,'2022-11-20 04:26:48','2022-11-20 04:26:48','Printing and Stationery '),(4,'2022-11-20 04:27:04','2022-11-20 04:27:04','Raw Material '),(5,'2022-11-20 04:27:23','2022-11-20 04:27:23','Rent Expense '),(6,'2022-11-20 04:27:41','2022-11-20 04:27:41','Telephone & Internet Expense '),(7,'2022-11-20 04:27:57','2022-11-20 04:27:57','Transportation & Travel Expense '),(8,'2023-11-21 09:58:15','2023-11-21 09:58:15','Food Expense'),(9,'2023-11-21 09:58:24','2023-11-21 09:58:24','Electricity Bill'),(10,'2023-11-21 09:58:35','2023-11-21 09:58:35','Cable Bill'),(11,'2023-11-21 09:58:40','2023-11-21 09:58:40','Internet Bill'),(12,'2023-11-21 09:58:49','2023-11-21 09:58:49','Water Bill'),(13,'2023-11-21 09:58:57','2023-11-21 09:58:57','Maintenance'),(14,'2023-11-21 09:59:05','2023-11-21 09:59:05','Employee Salaries'),(15,'2023-11-21 09:59:13','2023-11-21 09:59:13','Property Rent'),(16,'2023-11-21 09:59:19','2023-11-21 09:59:19','Property Tax'),(17,'2023-11-21 09:59:26','2023-11-21 09:59:26','Others'),(18,'2023-11-21 09:59:33','2023-11-21 09:59:33','Groceries'),(19,'2023-11-21 09:59:43','2023-11-21 09:59:43','Gas'),(20,'2023-11-21 09:59:48','2023-11-21 09:59:48','Housekeeping'),(21,'2023-11-21 10:00:09','2023-11-21 10:00:09','Promotions'),(22,'2023-11-21 10:00:16','2023-11-21 10:00:16','Miscellaneous'),(23,'2023-11-21 10:00:21','2023-11-21 10:00:21','Purchases'),(24,'2023-11-21 10:00:26','2023-11-21 10:00:26','Transport'),(25,'2023-11-21 10:00:37','2023-11-21 10:00:37','Telephone Bill'),(26,'2023-11-21 10:00:45','2023-11-21 10:00:45','Water Tanker');
/*!40000 ALTER TABLE `expense_category` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `expenses`
--

DROP TABLE IF EXISTS `expenses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `expenses` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `client_id` bigint DEFAULT NULL,
  `created_by` bigint DEFAULT NULL,
  `expense_category_id` bigint DEFAULT NULL,
  `expense_invoice_number` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `payment_mode` bigint DEFAULT NULL,
  `expense_date` timestamp NULL DEFAULT NULL,
  `item_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `quantity` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `rate` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `amount` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `notes` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `create_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `update_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `expenses_FK` (`expense_category_id`),
  KEY `expenses_FK_1` (`client_id`),
  KEY `expenses_FK_2` (`created_by`),
  KEY `expenses_FK_3` (`payment_mode`),
  CONSTRAINT `expenses_FK` FOREIGN KEY (`expense_category_id`) REFERENCES `expense_category` (`id`),
  CONSTRAINT `expenses_FK_1` FOREIGN KEY (`client_id`) REFERENCES `client_master` (`client_id`),
  CONSTRAINT `expenses_FK_2` FOREIGN KEY (`created_by`) REFERENCES `employess` (`emp_id`),
  CONSTRAINT `expenses_FK_3` FOREIGN KEY (`payment_mode`) REFERENCES `account` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `expenses`
--

LOCK TABLES `expenses` WRITE;
/*!40000 ALTER TABLE `expenses` DISABLE KEYS */;
/*!40000 ALTER TABLE `expenses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `gst`
--

DROP TABLE IF EXISTS `gst`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `gst` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `client_id` bigint DEFAULT NULL,
  `gstname` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `create_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `update_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` bigint DEFAULT NULL,
  `percentage` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `gst_FK` (`client_id`),
  KEY `gst_FK_1` (`created_by`),
  CONSTRAINT `gst_FK` FOREIGN KEY (`client_id`) REFERENCES `client_master` (`client_id`),
  CONSTRAINT `gst_FK_1` FOREIGN KEY (`created_by`) REFERENCES `employess` (`emp_id`)
) ENGINE=InnoDB AUTO_INCREMENT=36 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `gst`
--

LOCK TABLES `gst` WRITE;
/*!40000 ALTER TABLE `gst` DISABLE KEYS */;
INSERT INTO `gst` VALUES (1,21,'0 %','2024-09-18 12:34:27','2024-09-22 07:07:28',122,0),(2,21,'5 %','2024-09-22 07:06:33','2024-09-23 11:22:08',122,5),(3,NULL,'12 %','2024-09-23 08:06:26','2024-09-23 11:22:08',NULL,12),(4,NULL,'18 %','2024-09-23 08:06:38','2024-09-23 11:22:08',NULL,18),(5,NULL,'28 %','2024-09-23 08:06:46','2024-09-23 11:22:08',NULL,28);
/*!40000 ALTER TABLE `gst` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `login`
--

DROP TABLE IF EXISTS `login`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `login` (
  `login_id` bigint NOT NULL AUTO_INCREMENT,
  `login_email` varchar(100) DEFAULT NULL,
  `passkey` varchar(255) DEFAULT NULL,
  `salt` varchar(100) DEFAULT NULL,
  `login_name` varchar(100) DEFAULT NULL,
  `login_designation` varchar(100) DEFAULT NULL,
  `login_type` varchar(100) DEFAULT NULL,
  `client_id` bigint DEFAULT NULL,
  `last_login` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `create_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `update_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` bigint DEFAULT NULL,
  `emp_id` bigint DEFAULT NULL,
  `status` varchar(100) DEFAULT NULL,
  `category` bigint DEFAULT NULL,
  `role` bigint DEFAULT NULL,
  `password` varchar(100) DEFAULT NULL,
  `branch_id` bigint DEFAULT NULL,
  PRIMARY KEY (`login_id`),
  KEY `login_FK` (`client_id`),
  KEY `login_FK_1` (`emp_id`),
  KEY `login_FK_2` (`category`),
  KEY `login_FK_3` (`created_by`),
  KEY `login_FK_4` (`role`),
  KEY `login_FK_5` (`branch_id`),
  CONSTRAINT `login_FK` FOREIGN KEY (`client_id`) REFERENCES `client_master` (`client_id`),
  CONSTRAINT `login_FK_1` FOREIGN KEY (`emp_id`) REFERENCES `employess` (`emp_id`),
  CONSTRAINT `login_FK_2` FOREIGN KEY (`category`) REFERENCES `client_category` (`id`),
  CONSTRAINT `login_FK_3` FOREIGN KEY (`created_by`) REFERENCES `employess` (`emp_id`),
  CONSTRAINT `login_FK_4` FOREIGN KEY (`role`) REFERENCES `roles` (`id`),
  CONSTRAINT `login_FK_5` FOREIGN KEY (`branch_id`) REFERENCES `branch` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=56 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `login`
--

LOCK TABLES `login` WRITE;
/*!40000 ALTER TABLE `login` DISABLE KEYS */;
INSERT INTO `login` VALUES (1,'teamtrack','d70142594d0cda295f4313b720473cb46b533db33871b8aa3dac3a6ea8b7f1af45d1d1623f21b697fd05cda5287bbc82911fa653b4414591114c9a412da390cb','0b44c34c96aebf7','venkat reddy','PRESENDENT','INTERNAL',1,'2025-06-20 02:51:55','2022-03-04 04:32:48','2025-06-20 02:51:55',88,88,'ACTIVATED',1,1,NULL,NULL),(43,'slv-admin','d70142594d0cda295f4313b720473cb46b533db33871b8aa3dac3a6ea8b7f1af45d1d1623f21b697fd05cda5287bbc82911fa653b4414591114c9a412da390cb','0b44c34c96aebf7','slv-admin','MASTER','INTERNAL',19,'2025-09-17 03:20:11','2024-03-24 17:58:03','2025-09-17 03:20:11',88,120,'ACTIVATED',6,2,'jInMZuVxp5',NULL),(44,'jvvadmin@gmail.com','1e2c306e3eeeda367bef7f51a3100e0c963164a6415ff91802260e923d0132c16ecb42de610d95c5baf1cb4f6a28d1a28454aad8b1eb822e456107d866749b5b','001564233b0f1f8','jvvadmin','ADMIN','INTERNAL',20,'2026-05-23 02:41:39','2024-08-21 03:24:08','2026-05-23 02:41:39',88,121,'ACTIVATED',8,2,'UiLEK6lHxG',NULL),(45,'nanni','eea6048d9f692313c614aa938d9ab4906ab0326e4f72341519fef30310e8a94203f0d2aa6296f0535558d46a80e1a2aceb6411cbb0ef06b2c442e1717f759f71','9d07269c5f34a62','nanni','OWNER','INTERNAL',21,'2024-12-23 11:20:38','2024-09-18 10:23:40','2024-12-23 11:20:38',88,122,'ACTIVATED',2,3,'3sWa3qd6QZ',NULL),(46,'lab1','d5d6f47f15111d6198cfc2da74c7101c616c1aa787912317f64ba6ec247479c691591e80b9b1ff71379015860d4a624da40249b478ed44422400a707a5bba23f','16aaa750bb10044','SURYA KUMAR','LAB INCHARGE','INTERNAL',21,'2024-09-24 06:24:47','2024-09-23 15:53:31','2024-09-24 06:24:47',122,123,'ACTIVATED',2,6,'3JUk2hWLVk',NULL),(47,'sreedevi','f98428a0af745e567196152bfafb363bea7019193b1b47a99efa124249cd7f8cfd0abac3de4bea9d0f00b1b05ee6c5db7ab6d7aedd4982c56fa7f94cab42e161','95832797bcae19f','sreedevi','ADMIN','INTERNAL',22,'2024-12-23 10:14:56','2024-10-22 11:46:54','2024-12-23 10:14:56',88,124,'ACTIVATED',8,1,'Pkgpaxxat1',NULL),(48,'svhadmin@gmail.com','1106c85faa5fe847dd8d3baeedcd459450be5a72100e9960d3127dcb03a921012587652ae35a4bc8e59d7750ebfea1dcbf078f3ebe9bf443efb64665f88d9cb9','3bc2b1a4a4f72db','svh-admin','ADMIN','INTERNAL',23,'2026-05-26 02:31:32','2024-12-08 05:40:34','2026-05-26 02:31:32',88,125,'ACTIVATED',3,3,'yoLpAVieR5',NULL),(49,'ramireddy','7460ae7c2cf79289e64da099d5a542eeabad07e7ad7a9a7e9fe0c080f53c8b0b740346316d52ce3a87be2119d34aae22756e9dbd0568674fc9667dd65deee87d','17a8a5ea1534048','ramireddy','ADMINISTRATOR','INTERNAL',20,'2025-01-15 17:51:40','2024-12-23 11:04:09','2025-01-15 17:51:40',88,126,'ACTIVATED',7,1,'QWUKfI4ENq',NULL),(50,'vijay@tt.com','dd4be886d9633a021fa1a9ebc440805a70ace8902afa8357d8656ee9a93d99c37c80b849d95fe3ffc53c4f334168157022de23c3c1732d4c812e8c90f93053e0','b54282c779f68c3','vijay','Admin','INTERNAL',24,'2025-10-16 12:27:22','2025-05-30 08:26:22','2025-10-16 12:27:22',88,127,'ACTIVATED',9,1,'XixFXdcwd0',NULL),(55,'SREEVENKAT0804@GMAIL.COM','67194f9f0b261d67296f1ea9c8727750ef87ee9514b5128970db34d182106544fd80e8347680615553d4afab600f81f600c2b61390f6784f2b26fcd9cda38e67','5980c63863529eb','SREEDEVI ANNAREDDY A','SENIOR','TEACHER',23,'2026-05-26 01:50:25','2026-05-26 01:43:11','2026-05-26 01:50:25',NULL,NULL,'ACTIVATED',3,7,NULL,NULL);
/*!40000 ALTER TABLE `login` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `menu_list`
--

DROP TABLE IF EXISTS `menu_list`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `menu_list` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `client_id` bigint DEFAULT NULL,
  `module_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `menu_list` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `create_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `update_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `roles` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `menu_list_FK` (`client_id`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `menu_list`
--

LOCK TABLES `menu_list` WRITE;
/*!40000 ALTER TABLE `menu_list` DISABLE KEYS */;
INSERT INTO `menu_list` VALUES (1,3,'HOME','HOME','2023-02-07 07:35:54','2023-02-07 07:35:54',NULL),(2,3,'PARTIES','PARTIES','2023-02-07 07:36:08','2023-02-07 07:36:08',NULL),(3,3,'ADMIN','MAIN','2023-02-07 07:36:23','2023-02-07 07:36:23',NULL),(4,3,'ADMIN','BRANCH','2023-02-07 07:36:29','2023-02-07 07:36:29',NULL),(5,3,'ADMIN','VENDORS','2023-02-07 07:36:36','2023-02-07 07:36:36',NULL),(6,3,'ADMIN','EMPLOYESS','2023-02-07 07:36:44','2023-02-07 07:36:44',NULL),(7,3,'PRODUCTS','PRODUCT LIST','2023-02-07 07:37:02','2023-02-07 07:37:02',NULL),(8,3,'SALES','SALES INVOICE','2023-02-07 07:37:20','2023-02-07 07:37:20',NULL),(9,3,'SALES','ONLINE STORE','2023-02-07 07:37:35','2023-02-07 07:37:35',NULL),(10,3,'PURCHASE','PURCHASE INVOICE','2023-02-07 07:37:52','2023-02-07 07:37:52',NULL),(11,3,'CHASH & BANK','CHASH & BANK','2023-02-07 07:38:10','2023-02-07 07:38:10',NULL),(12,3,'EXPENSES','EXPENSES','2023-02-07 07:38:25','2023-02-07 07:38:25',NULL),(13,3,'REPORTS','REPORTS','2023-02-07 07:38:40','2023-02-07 07:38:40',NULL),(14,3,'SETTINGS','SETTINGS','2023-02-07 07:38:52','2023-02-17 16:23:08','1,2,3,9');
/*!40000 ALTER TABLE `menu_list` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `client_id` bigint DEFAULT NULL,
  `role_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `create_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `navbar` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  PRIMARY KEY (`id`),
  KEY `roles_FK` (`client_id`),
  CONSTRAINT `roles_FK` FOREIGN KEY (`client_id`) REFERENCES `client_master` (`client_id`),
  CONSTRAINT `roles_chk_1` CHECK (json_valid(`navbar`))
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES (1,1,'ADMINISTRATOR','2023-02-05 04:17:49','2023-02-19 16:50:45','{\"navbar\": [{\"id\": \"dashboard\", \"icon\": \"feather icon-star\", \"type\": \"group\", \"title\": \"Dashboard\", \"children\": [{\"id\": \"home\", \"url\": \"/dashboard/default\", \"icon\": \"feather icon-home\", \"type\": \"item\", \"title\": \"Home\", \"classes\": \"nav-item\"}]}, {\"id\": \"parties\", \"url\": \"/parties\", \"icon\": \"feather icon-user\", \"type\": \"item\", \"title\": \"Parties\", \"classes\": \"nav-item\"}, {\"id\": \"admin\", \"icon\": \"feather icon-box\", \"type\": \"collapse\", \"title\": \"Admin Dashboard\", \"children\": [{\"id\": \"core\", \"url\": \"/admin/categoryList\", \"icon\": \"feather icon-list\", \"type\": \"item\", \"title\": \"Core Data\", \"classes\": \"nav-item\"}, {\"id\": \"branch\", \"url\": \"/admin/branchList\", \"icon\": \"feather icon-home\", \"type\": \"item\", \"title\": \"Branch\", \"classes\": \"nav-item\"}, {\"id\": \"employees\", \"url\": \"/admin/employeeList\", \"icon\": \"feather icon-user\", \"type\": \"item\", \"title\": \"Employees\", \"classes\": \"nav-item\"}, {\"id\": \"vendor\", \"url\": \"/admin/vendor\", \"icon\": \"feather icon-box\", \"type\": \"item\", \"title\": \"Vendor\", \"classes\": \"nav-item\"}, {\"id\": \"clients\", \"url\": \"/admin/clients-list\", \"icon\": \"feather icon-users\", \"type\": \"item\", \"title\": \"Clients\", \"classes\": \"nav-item\"}]}, {\"id\": \"product\", \"icon\": \"feather icon-map\", \"type\": \"collapse\", \"title\": \"Products\", \"children\": [{\"id\": \"productslist\", \"url\": \"/products/productList\", \"icon\": \"feather icon-list\", \"type\": \"item\", \"title\": \"Product List\", \"classes\": \"nav-item\"}]}, {\"id\": \"sales\", \"icon\": \"feather icon-star\", \"type\": \"collapse\", \"title\": \"Sales\", \"children\": [{\"id\": \"invoice\", \"url\": \"/sales/invoiceList\", \"icon\": \"feather icon-file\", \"type\": \"item\", \"title\": \"Invoice\", \"classes\": \"nav-item\"}]}, {\"id\": \"purchase\", \"icon\": \"feather icon-server\", \"type\": \"collapse\", \"title\": \"Purchase\", \"children\": [{\"id\": \"purchaselist\", \"url\": \"/purchase/purchase-list\", \"icon\": \"feather icon-list\", \"type\": \"item\", \"title\": \"Purchase List\", \"classes\": \"nav-item\"}]}, {\"id\": \"Cash & Bank\", \"url\": \"/cash&bank/list\", \"icon\": \"feather icon-home\", \"type\": \"item\", \"title\": \"Cash & Bank\", \"classes\": \"nav-item\"}, {\"id\": \"Expenses\", \"url\": \"/expenses/expenses-list\", \"icon\": \"feather icon-layers\", \"type\": \"item\", \"title\": \"Expenses\", \"classes\": \"nav-item\"}, {\"id\": \"Reports\", \"url\": \"/reports/\", \"icon\": \"feather icon-inbox\", \"type\": \"item\", \"title\": \"Reports\", \"classes\": \"nav-item\"}, {\"id\": \"settings\", \"icon\": \"feather icon-settings\", \"type\": \"collapse\", \"title\": \"Settings\", \"children\": [{\"id\": \"company profile\", \"url\": \"/settings/company-profile\", \"icon\": \"feather icon-book\", \"type\": \"item\", \"title\": \"Company profile\", \"classes\": \"nav-item\"}, {\"id\": \"User Roles\", \"url\": \"/settings/user-roles\", \"icon\": \"feather icon-users\", \"type\": \"item\", \"title\": \"User Roles\", \"classes\": \"nav-item\"}]}, {\"id\": \"ui-element\", \"icon\": \"feather icon-layers\", \"type\": \"group\", \"title\": \"UI ELEMENT\", \"children\": [{\"id\": \"basic\", \"icon\": \"feather icon-box\", \"type\": \"collapse\", \"title\": \"Basic\", \"children\": [{\"id\": \"button\", \"url\": \"/basic/button\", \"type\": \"item\", \"title\": \"Button\"}, {\"id\": \"cards\", \"url\": \"/basic/cards\", \"type\": \"item\", \"title\": \"Cards\"}, {\"id\": \"tabs-pills\", \"url\": \"/basic/tabs-pills\", \"type\": \"item\", \"title\": \"Tabs & Pills\"}, {\"id\": \"other\", \"url\": \"/basic/other\", \"type\": \"item\", \"title\": \"Other\"}]}]}]}'),(2,NULL,'MASTER','2023-02-05 04:17:55','2023-02-20 09:52:29','{\"navbar\": [{\"id\": \"dashboard\", \"icon\": \"feather icon-star\", \"type\": \"group\", \"title\": \"Dashboard\", \"children\": [{\"id\": \"home\", \"url\": \"/dashboard/default\", \"icon\": \"feather icon-home\", \"type\": \"item\", \"title\": \"Home\", \"classes\": \"nav-item\"}]}, {\"id\": \"parties\", \"url\": \"/parties\", \"icon\": \"feather icon-user\", \"type\": \"item\", \"title\": \"Parties\", \"classes\": \"nav-item\"}, {\"id\": \"admin\", \"icon\": \"feather icon-box\", \"type\": \"collapse\", \"title\": \"Admin Dashboard\", \"children\": [{\"id\": \"core\", \"url\": \"/admin/categoryList\", \"icon\": \"feather icon-list\", \"type\": \"item\", \"title\": \"Core Data\", \"classes\": \"nav-item\"}, {\"id\": \"branch\", \"url\": \"/admin/branchList\", \"icon\": \"feather icon-home\", \"type\": \"item\", \"title\": \"Branch\", \"classes\": \"nav-item\"}, {\"id\": \"employees\", \"url\": \"/admin/employeeList\", \"icon\": \"feather icon-user\", \"type\": \"item\", \"title\": \"Employees\", \"classes\": \"nav-item\"}, {\"id\": \"vendor\", \"url\": \"/admin/vendor\", \"icon\": \"feather icon-box\", \"type\": \"item\", \"title\": \"Vendor\", \"classes\": \"nav-item\"}]}, {\"id\": \"product\", \"icon\": \"feather icon-map\", \"type\": \"collapse\", \"title\": \"Products\", \"children\": [{\"id\": \"productslist\", \"url\": \"/products/productList\", \"icon\": \"feather icon-list\", \"type\": \"item\", \"title\": \"Product List\", \"classes\": \"nav-item\"}]}, {\"id\": \"sales\", \"icon\": \"feather icon-star\", \"type\": \"collapse\", \"title\": \"Sales\", \"children\": [{\"id\": \"invoice\", \"url\": \"/sales/invoiceList\", \"icon\": \"feather icon-file\", \"type\": \"item\", \"title\": \"Invoice\", \"classes\": \"nav-item\"}]}, {\"id\": \"purchase\", \"icon\": \"feather icon-server\", \"type\": \"collapse\", \"title\": \"Purchase\", \"children\": [{\"id\": \"purchaselist\", \"url\": \"/purchase/purchase-list\", \"icon\": \"feather icon-list\", \"type\": \"item\", \"title\": \"Purchase List\", \"classes\": \"nav-item\"}]}, {\"id\": \"Cash & Bank\", \"url\": \"/cash&bank/list\", \"icon\": \"feather icon-home\", \"type\": \"item\", \"title\": \"Cash & Bank\", \"classes\": \"nav-item\"}, {\"id\": \"Expenses\", \"url\": \"/expenses/expenses-list\", \"icon\": \"feather icon-layers\", \"type\": \"item\", \"title\": \"Expenses\", \"classes\": \"nav-item\"}, {\"id\": \"Reports\", \"url\": \"/reports/\", \"icon\": \"feather icon-inbox\", \"type\": \"item\", \"title\": \"Reports\", \"classes\": \"nav-item\"}, {\"id\": \"settings\", \"icon\": \"feather icon-settings\", \"type\": \"collapse\", \"title\": \"Settings\", \"children\": [{\"id\": \"company profile\", \"url\": \"/settings/company-profile\", \"icon\": \"feather icon-book\", \"type\": \"item\", \"title\": \"Company profile\", \"classes\": \"nav-item\"}, {\"id\": \"User Roles\", \"url\": \"/settings/user-roles\", \"icon\": \"feather icon-users\", \"type\": \"item\", \"title\": \"User Roles\", \"classes\": \"nav-item\"}, {\"id\": \"Accounts\", \"url\": \"/settings/accounts\", \"icon\": \"feather icon-cash\", \"type\": \"item\", \"title\": \"Accounts\", \"classes\": \"nav-item\"}]}]}'),(3,NULL,'ADMIN','2023-02-05 04:18:04','2023-02-20 09:52:29','{\"navbar\": [{\"id\": \"dashboard\", \"icon\": \"feather icon-star\", \"type\": \"group\", \"title\": \"Dashboard\", \"children\": [{\"id\": \"home\", \"url\": \"/dashboard/default\", \"icon\": \"feather icon-home\", \"type\": \"item\", \"title\": \"Home\", \"classes\": \"nav-item\"}]}, {\"id\": \"parties\", \"url\": \"/parties\", \"icon\": \"feather icon-user\", \"type\": \"item\", \"title\": \"Parties\", \"classes\": \"nav-item\"}, {\"id\": \"admin\", \"icon\": \"feather icon-box\", \"type\": \"collapse\", \"title\": \"Admin Dashboard\", \"children\": [{\"id\": \"core\", \"url\": \"/admin/categoryList\", \"icon\": \"feather icon-list\", \"type\": \"item\", \"title\": \"Core Data\", \"classes\": \"nav-item\"}, {\"id\": \"branch\", \"url\": \"/admin/branchList\", \"icon\": \"feather icon-home\", \"type\": \"item\", \"title\": \"Branch\", \"classes\": \"nav-item\"}, {\"id\": \"employees\", \"url\": \"/admin/employeeList\", \"icon\": \"feather icon-user\", \"type\": \"item\", \"title\": \"Employees\", \"classes\": \"nav-item\"}, {\"id\": \"vendor\", \"url\": \"/admin/vendor\", \"icon\": \"feather icon-box\", \"type\": \"item\", \"title\": \"Vendor\", \"classes\": \"nav-item\"}]}, {\"id\": \"product\", \"icon\": \"feather icon-map\", \"type\": \"collapse\", \"title\": \"Products\", \"children\": [{\"id\": \"productslist\", \"url\": \"/products/productList\", \"icon\": \"feather icon-list\", \"type\": \"item\", \"title\": \"Product List\", \"classes\": \"nav-item\"}]}, {\"id\": \"sales\", \"icon\": \"feather icon-star\", \"type\": \"collapse\", \"title\": \"Sales\", \"children\": [{\"id\": \"invoice\", \"url\": \"/sales/invoiceList\", \"icon\": \"feather icon-file\", \"type\": \"item\", \"title\": \"Invoice\", \"classes\": \"nav-item\"}]}, {\"id\": \"purchase\", \"icon\": \"feather icon-server\", \"type\": \"collapse\", \"title\": \"Purchase\", \"children\": [{\"id\": \"purchaselist\", \"url\": \"/purchase/purchase-list\", \"icon\": \"feather icon-list\", \"type\": \"item\", \"title\": \"Purchase List\", \"classes\": \"nav-item\"}]}, {\"id\": \"Cash & Bank\", \"url\": \"/cash&bank/list\", \"icon\": \"feather icon-home\", \"type\": \"item\", \"title\": \"Cash & Bank\", \"classes\": \"nav-item\"}, {\"id\": \"Expenses\", \"url\": \"/expenses/expenses-list\", \"icon\": \"feather icon-layers\", \"type\": \"item\", \"title\": \"Expenses\", \"classes\": \"nav-item\"}, {\"id\": \"Reports\", \"url\": \"/reports/\", \"icon\": \"feather icon-inbox\", \"type\": \"item\", \"title\": \"Reports\", \"classes\": \"nav-item\"}, {\"id\": \"settings\", \"icon\": \"feather icon-settings\", \"type\": \"collapse\", \"title\": \"Settings\", \"children\": [{\"id\": \"company profile\", \"url\": \"/settings/company-profile\", \"icon\": \"feather icon-book\", \"type\": \"item\", \"title\": \"Company profile\", \"classes\": \"nav-item\"}, {\"id\": \"User Roles\", \"url\": \"/settings/user-roles\", \"icon\": \"feather icon-users\", \"type\": \"item\", \"title\": \"User Roles\", \"classes\": \"nav-item\"}, {\"id\": \"Accounts\", \"url\": \"/settings/accounts\", \"icon\": \"feather icon-cash\", \"type\": \"item\", \"title\": \"Accounts\", \"classes\": \"nav-item\"}]}]}'),(4,NULL,'BRANCH MANAGER','2023-02-05 04:18:14','2023-02-20 06:18:49','{\"navbar\": [{\"id\": \"dashboard\", \"icon\": \"feather icon-star\", \"type\": \"group\", \"title\": \"Dashboard\", \"children\": [{\"id\": \"home\", \"url\": \"/dashboard/default\", \"icon\": \"feather icon-home\", \"type\": \"item\", \"title\": \"Home\", \"classes\": \"nav-item\"}]}, {\"id\": \"parties\", \"url\": \"/parties\", \"icon\": \"feather icon-user\", \"type\": \"item\", \"title\": \"Parties\", \"classes\": \"nav-item\"}, {\"id\": \"admin\", \"icon\": \"feather icon-box\", \"type\": \"collapse\", \"title\": \"Admin Dashboard\", \"children\": [{\"id\": \"core\", \"url\": \"/admin/categoryList\", \"icon\": \"feather icon-list\", \"type\": \"item\", \"title\": \"Core Data\", \"classes\": \"nav-item\"}, {\"id\": \"employees\", \"url\": \"/admin/employeeList\", \"icon\": \"feather icon-user\", \"type\": \"item\", \"title\": \"Employees\", \"classes\": \"nav-item\"}, {\"id\": \"vendor\", \"url\": \"/admin/vendor\", \"icon\": \"feather icon-box\", \"type\": \"item\", \"title\": \"Vendor\", \"classes\": \"nav-item\"}]}, {\"id\": \"product\", \"icon\": \"feather icon-map\", \"type\": \"collapse\", \"title\": \"Products\", \"children\": [{\"id\": \"productslist\", \"url\": \"/products/productList\", \"icon\": \"feather icon-list\", \"type\": \"item\", \"title\": \"Product List\", \"classes\": \"nav-item\"}]}, {\"id\": \"sales\", \"icon\": \"feather icon-star\", \"type\": \"collapse\", \"title\": \"Sales\", \"children\": [{\"id\": \"invoice\", \"url\": \"/sales/invoiceList\", \"icon\": \"feather icon-file\", \"type\": \"item\", \"title\": \"Invoice\", \"classes\": \"nav-item\"}]}, {\"id\": \"purchase\", \"icon\": \"feather icon-server\", \"type\": \"collapse\", \"title\": \"Purchase\", \"children\": [{\"id\": \"purchaselist\", \"url\": \"/purchase/purchase-list\", \"icon\": \"feather icon-list\", \"type\": \"item\", \"title\": \"Purchase List\", \"classes\": \"nav-item\"}]}, {\"id\": \"Cash & Bank\", \"url\": \"/cash&bank/list\", \"icon\": \"feather icon-home\", \"type\": \"item\", \"title\": \"Cash & Bank\", \"classes\": \"nav-item\"}, {\"id\": \"Expenses\", \"url\": \"/expenses/expenses-list\", \"icon\": \"feather icon-layers\", \"type\": \"item\", \"title\": \"Expenses\", \"classes\": \"nav-item\"}, {\"id\": \"Reports\", \"url\": \"/reports/\", \"icon\": \"feather icon-inbox\", \"type\": \"item\", \"title\": \"Reports\", \"classes\": \"nav-item\"}, {\"id\": \"settings\", \"icon\": \"feather icon-settings\", \"type\": \"collapse\", \"title\": \"Settings\", \"children\": [{\"id\": \"company profile\", \"url\": \"/settings/company-profile\", \"icon\": \"feather icon-book\", \"type\": \"item\", \"title\": \"Company profile\", \"classes\": \"nav-item\"}, {\"id\": \"User Roles\", \"url\": \"/settings/user-roles\", \"icon\": \"feather icon-users\", \"type\": \"item\", \"title\": \"User Roles\", \"classes\": \"nav-item\"}]}]}'),(5,NULL,'MANAGER','2023-02-05 04:18:23','2023-02-20 06:18:49','{\"navbar\": [{\"id\": \"dashboard\", \"icon\": \"feather icon-star\", \"type\": \"group\", \"title\": \"Dashboard\", \"children\": [{\"id\": \"home\", \"url\": \"/dashboard/default\", \"icon\": \"feather icon-home\", \"type\": \"item\", \"title\": \"Home\", \"classes\": \"nav-item\"}]}, {\"id\": \"parties\", \"url\": \"/parties\", \"icon\": \"feather icon-user\", \"type\": \"item\", \"title\": \"Parties\", \"classes\": \"nav-item\"}, {\"id\": \"admin\", \"icon\": \"feather icon-box\", \"type\": \"collapse\", \"title\": \"Admin Dashboard\", \"children\": [{\"id\": \"core\", \"url\": \"/admin/categoryList\", \"icon\": \"feather icon-list\", \"type\": \"item\", \"title\": \"Core Data\", \"classes\": \"nav-item\"}, {\"id\": \"employees\", \"url\": \"/admin/employeeList\", \"icon\": \"feather icon-user\", \"type\": \"item\", \"title\": \"Employees\", \"classes\": \"nav-item\"}, {\"id\": \"vendor\", \"url\": \"/admin/vendor\", \"icon\": \"feather icon-box\", \"type\": \"item\", \"title\": \"Vendor\", \"classes\": \"nav-item\"}]}, {\"id\": \"product\", \"icon\": \"feather icon-map\", \"type\": \"collapse\", \"title\": \"Products\", \"children\": [{\"id\": \"productslist\", \"url\": \"/products/productList\", \"icon\": \"feather icon-list\", \"type\": \"item\", \"title\": \"Product List\", \"classes\": \"nav-item\"}]}, {\"id\": \"sales\", \"icon\": \"feather icon-star\", \"type\": \"collapse\", \"title\": \"Sales\", \"children\": [{\"id\": \"invoice\", \"url\": \"/sales/invoiceList\", \"icon\": \"feather icon-file\", \"type\": \"item\", \"title\": \"Invoice\", \"classes\": \"nav-item\"}]}, {\"id\": \"purchase\", \"icon\": \"feather icon-server\", \"type\": \"collapse\", \"title\": \"Purchase\", \"children\": [{\"id\": \"purchaselist\", \"url\": \"/purchase/purchase-list\", \"icon\": \"feather icon-list\", \"type\": \"item\", \"title\": \"Purchase List\", \"classes\": \"nav-item\"}]}, {\"id\": \"Cash & Bank\", \"url\": \"/cash&bank/list\", \"icon\": \"feather icon-home\", \"type\": \"item\", \"title\": \"Cash & Bank\", \"classes\": \"nav-item\"}, {\"id\": \"Expenses\", \"url\": \"/expenses/expenses-list\", \"icon\": \"feather icon-layers\", \"type\": \"item\", \"title\": \"Expenses\", \"classes\": \"nav-item\"}, {\"id\": \"Reports\", \"url\": \"/reports/\", \"icon\": \"feather icon-inbox\", \"type\": \"item\", \"title\": \"Reports\", \"classes\": \"nav-item\"}, {\"id\": \"settings\", \"icon\": \"feather icon-settings\", \"type\": \"collapse\", \"title\": \"Settings\", \"children\": [{\"id\": \"company profile\", \"url\": \"/settings/company-profile\", \"icon\": \"feather icon-book\", \"type\": \"item\", \"title\": \"Company profile\", \"classes\": \"nav-item\"}, {\"id\": \"User Roles\", \"url\": \"/settings/user-roles\", \"icon\": \"feather icon-users\", \"type\": \"item\", \"title\": \"User Roles\", \"classes\": \"nav-item\"}]}]}'),(6,NULL,'SALESMAN','2023-02-05 04:18:37','2023-02-20 06:18:49','{\"navbar\": [{\"id\": \"dashboard\", \"icon\": \"feather icon-star\", \"type\": \"group\", \"title\": \"Dashboard\", \"children\": [{\"id\": \"home\", \"url\": \"/dashboard/default\", \"icon\": \"feather icon-home\", \"type\": \"item\", \"title\": \"Home\", \"classes\": \"nav-item\"}]}, {\"id\": \"parties\", \"url\": \"/parties\", \"icon\": \"feather icon-user\", \"type\": \"item\", \"title\": \"Parties\", \"classes\": \"nav-item\"}, {\"id\": \"product\", \"icon\": \"feather icon-map\", \"type\": \"collapse\", \"title\": \"Products\", \"children\": [{\"id\": \"productslist\", \"url\": \"/products/productList\", \"icon\": \"feather icon-list\", \"type\": \"item\", \"title\": \"Product List\", \"classes\": \"nav-item\"}]}, {\"id\": \"sales\", \"icon\": \"feather icon-star\", \"type\": \"collapse\", \"title\": \"Sales\", \"children\": [{\"id\": \"invoice\", \"url\": \"/sales/invoiceList\", \"icon\": \"feather icon-file\", \"type\": \"item\", \"title\": \"Invoice\", \"classes\": \"nav-item\"}]}, {\"id\": \"Cash & Bank\", \"url\": \"/cash&bank/list\", \"icon\": \"feather icon-home\", \"type\": \"item\", \"title\": \"Cash & Bank\", \"classes\": \"nav-item\"}, {\"id\": \"Expenses\", \"url\": \"/expenses/expenses-list\", \"icon\": \"feather icon-layers\", \"type\": \"item\", \"title\": \"Expenses\", \"classes\": \"nav-item\"}]}'),(7,NULL,'TEACHER','2023-02-05 04:18:47','2026-05-26 01:50:09',NULL),(8,NULL,'ACCOUNT MANAGER','2023-02-05 04:18:59','2023-02-20 06:18:49','{\"navbar\": [{\"id\": \"dashboard\", \"icon\": \"feather icon-star\", \"type\": \"group\", \"title\": \"Dashboard\", \"children\": [{\"id\": \"home\", \"url\": \"/dashboard/default\", \"icon\": \"feather icon-home\", \"type\": \"item\", \"title\": \"Home\", \"classes\": \"nav-item\"}]}, {\"id\": \"Reports\", \"url\": \"/reports/\", \"icon\": \"feather icon-inbox\", \"type\": \"item\", \"title\": \"Reports\", \"classes\": \"nav-item\"}]}'),(9,NULL,'ACCOUNTENT','2023-02-05 04:19:10','2023-02-20 06:18:49','{\"navbar\": [{\"id\": \"dashboard\", \"icon\": \"feather icon-star\", \"type\": \"group\", \"title\": \"Dashboard\", \"children\": [{\"id\": \"home\", \"url\": \"/dashboard/default\", \"icon\": \"feather icon-home\", \"type\": \"item\", \"title\": \"Home\", \"classes\": \"nav-item\"}]}, {\"id\": \"Reports\", \"url\": \"/reports/\", \"icon\": \"feather icon-inbox\", \"type\": \"item\", \"title\": \"Reports\", \"classes\": \"nav-item\"}]}'),(10,23,'TEACHER','2026-05-26 01:43:11','2026-05-26 01:43:11','{\"navbar\":[]}');
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'global'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-05-26  8:06:50
