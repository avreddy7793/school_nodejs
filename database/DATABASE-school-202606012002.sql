-- MySQL dump 10.13  Distrib 9.4.0, for macos15.4 (arm64)
--
-- Host: localhost    Database: school
-- ------------------------------------------------------
-- Server version	8.0.41

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
-- Table structure for table `attendance`
--

DROP TABLE IF EXISTS `attendance`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `attendance` (
  `attendance_id` int NOT NULL AUTO_INCREMENT,
  `client_id` bigint DEFAULT NULL,
  `student_id` int DEFAULT NULL,
  `teacher_id` int DEFAULT NULL,
  `attendance_date` date DEFAULT NULL,
  `morning_status` enum('Present','Absent','Late','Leave') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT 'Leave',
  `afternoon_status` enum('Present','Absent','Late','Leave') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT 'Leave',
  `remarks` varchar(255) DEFAULT NULL,
  `check_in_time_morning` time DEFAULT NULL,
  `check_out_time_morning` time DEFAULT NULL,
  `check_in_time_afternoon` time DEFAULT NULL,
  `check_out_time_afternoon` time DEFAULT NULL,
  PRIMARY KEY (`attendance_id`),
  UNIQUE KEY `unique_student_date` (`student_id`,`attendance_date`),
  KEY `teacher_id` (`teacher_id`),
  KEY `attendance_client_master_FK` (`client_id`),
  CONSTRAINT `attendance_client_master_FK_1` FOREIGN KEY (`client_id`) REFERENCES `client_master` (`client_id`),
  CONSTRAINT `attendance_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`),
  CONSTRAINT `attendance_ibfk_2` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`teacher_id`)
) ENGINE=InnoDB AUTO_INCREMENT=198 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `attendance`
--

LOCK TABLES `attendance` WRITE;
/*!40000 ALTER TABLE `attendance` DISABLE KEYS */;
/*!40000 ALTER TABLE `attendance` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `attendance_settings`
--

DROP TABLE IF EXISTS `attendance_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `attendance_settings` (
  `setting_id` int NOT NULL AUTO_INCREMENT,
  `client_id` bigint NOT NULL,
  `setting_key` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `setting_value` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`setting_id`),
  UNIQUE KEY `uq_attendance_settings_client_key` (`client_id`,`setting_key`),
  CONSTRAINT `attendance_settings_client_master_FK` FOREIGN KEY (`client_id`) REFERENCES `client_master` (`client_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `attendance_settings`
--

LOCK TABLES `attendance_settings` WRITE;
/*!40000 ALTER TABLE `attendance_settings` DISABLE KEYS */;
INSERT INTO `attendance_settings` VALUES (1,23,'student_attendance_mode','SESSION_WISE','2026-05-31 17:38:24','2026-05-31 17:58:56');
/*!40000 ALTER TABLE `attendance_settings` ENABLE KEYS */;
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
  CONSTRAINT `branch_client_master_FK` FOREIGN KEY (`client_id`) REFERENCES `client_master` (`client_id`),
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
-- Table structure for table `class_schedule`
--

DROP TABLE IF EXISTS `class_schedule`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `class_schedule` (
  `schedule_id` int NOT NULL AUTO_INCREMENT,
  `client_id` bigint DEFAULT NULL,
  `classroom_id` int NOT NULL,
  `section_id` int DEFAULT NULL,
  `subject_id` int DEFAULT NULL,
  `session_id` int NOT NULL,
  `period_id` int NOT NULL,
  `teacher_id` int NOT NULL,
  `day_of_week` tinyint DEFAULT NULL,
  `schedule_date` date DEFAULT NULL,
  `status` enum('Active','Inactive','Cancelled') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Active',
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`schedule_id`),
  UNIQUE KEY `uq_class_schedule_slot` (`classroom_id`,`session_id`,`period_id`,`day_of_week`,`schedule_date`),
  UNIQUE KEY `uq_teacher_schedule_slot` (`teacher_id`,`period_id`,`day_of_week`,`schedule_date`),
  UNIQUE KEY `uq_class_section_schedule_slot` (`classroom_id`,`section_id`,`period_id`,`day_of_week`,`schedule_date`),
  KEY `idx_class_schedule_classroom` (`classroom_id`),
  KEY `idx_class_schedule_session` (`session_id`),
  KEY `idx_class_schedule_period` (`period_id`),
  KEY `idx_class_schedule_teacher` (`teacher_id`),
  KEY `fk_class_schedule_section` (`section_id`),
  KEY `fk_class_schedule_subject` (`subject_id`),
  KEY `class_schedule_client_master_FK` (`client_id`),
  CONSTRAINT `class_schedule_client_master_FK` FOREIGN KEY (`client_id`) REFERENCES `client_master` (`client_id`),
  CONSTRAINT `fk_class_schedule_classroom` FOREIGN KEY (`classroom_id`) REFERENCES `classrooms` (`classroom_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_class_schedule_period` FOREIGN KEY (`period_id`) REFERENCES `session_periods` (`period_id`),
  CONSTRAINT `fk_class_schedule_section` FOREIGN KEY (`section_id`) REFERENCES `sections` (`section_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_class_schedule_session` FOREIGN KEY (`session_id`) REFERENCES `school_sessions` (`session_id`),
  CONSTRAINT `fk_class_schedule_subject` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`subject_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_class_schedule_teacher` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`teacher_id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=34 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `class_schedule`
--

LOCK TABLES `class_schedule` WRITE;
/*!40000 ALTER TABLE `class_schedule` DISABLE KEYS */;
INSERT INTO `class_schedule` VALUES (2,23,10,10,38,3,15,14,1,NULL,'Active',NULL,'2026-05-31 08:07:21','2026-05-31 08:07:21'),(3,23,10,10,35,3,19,13,1,NULL,'Active',NULL,'2026-05-31 08:07:21','2026-05-31 08:07:21'),(4,23,10,10,36,3,14,10,1,NULL,'Active',NULL,'2026-05-31 08:07:21','2026-05-31 08:07:21'),(5,23,10,10,37,3,12,9,1,NULL,'Active',NULL,'2026-05-31 08:07:21','2026-05-31 08:07:21'),(6,23,10,10,35,3,13,13,1,NULL,'Active',NULL,'2026-05-31 08:07:21','2026-05-31 08:07:21'),(7,23,10,10,37,3,18,9,1,NULL,'Active',NULL,'2026-05-31 08:07:21','2026-05-31 08:07:21'),(8,23,10,10,39,3,16,10,1,NULL,'Active',NULL,'2026-05-31 08:07:21','2026-05-31 08:07:21'),(9,23,10,10,40,3,17,11,1,NULL,'Active',NULL,'2026-05-31 08:07:21','2026-05-31 08:07:21'),(10,23,9,7,44,3,13,10,1,NULL,'Active',NULL,'2026-05-31 08:17:15','2026-05-31 08:17:15'),(11,23,9,7,45,3,14,14,1,NULL,'Active',NULL,'2026-05-31 08:17:15','2026-05-31 08:17:15'),(12,23,9,7,42,3,12,13,1,NULL,'Active',NULL,'2026-05-31 08:17:15','2026-05-31 08:17:15'),(13,23,9,7,47,3,16,11,1,NULL,'Active',NULL,'2026-05-31 08:17:15','2026-05-31 08:17:15'),(14,23,9,7,46,3,15,10,1,NULL,'Active',NULL,'2026-05-31 08:17:15','2026-05-31 08:17:15'),(15,23,9,7,41,3,17,12,1,NULL,'Active',NULL,'2026-05-31 08:17:15','2026-05-31 08:17:15'),(16,23,9,7,42,3,18,13,1,NULL,'Active',NULL,'2026-05-31 08:17:15','2026-05-31 08:17:15'),(17,23,9,7,44,3,19,10,1,NULL,'Active',NULL,'2026-05-31 08:17:15','2026-05-31 08:17:15'),(18,23,10,10,37,3,12,9,2,NULL,'Active',NULL,'2026-05-31 08:30:07','2026-05-31 08:30:07'),(19,23,10,10,36,3,14,10,2,NULL,'Active',NULL,'2026-05-31 08:30:07','2026-05-31 08:30:07'),(20,23,10,10,35,3,13,13,2,NULL,'Active',NULL,'2026-05-31 08:30:07','2026-05-31 08:30:07'),(21,23,10,10,38,3,15,14,2,NULL,'Active',NULL,'2026-05-31 08:30:07','2026-05-31 08:30:07'),(22,23,10,10,39,3,16,10,2,NULL,'Active',NULL,'2026-05-31 08:30:07','2026-05-31 08:30:07'),(23,23,10,10,40,3,17,11,2,NULL,'Active',NULL,'2026-05-31 08:30:07','2026-05-31 08:30:07'),(24,23,10,10,37,3,18,9,2,NULL,'Active',NULL,'2026-05-31 08:30:07','2026-05-31 08:30:07'),(25,23,10,10,35,3,19,13,2,NULL,'Active',NULL,'2026-05-31 08:30:07','2026-05-31 08:30:07'),(26,23,9,7,45,3,14,14,2,NULL,'Active',NULL,'2026-05-31 15:03:36','2026-05-31 15:03:36'),(27,23,9,7,41,3,17,12,2,NULL,'Active',NULL,'2026-05-31 15:03:36','2026-05-31 15:03:36'),(28,23,9,7,42,3,12,13,2,NULL,'Active',NULL,'2026-05-31 15:03:36','2026-05-31 15:03:36'),(29,23,9,7,46,3,15,10,2,NULL,'Active',NULL,'2026-05-31 15:03:36','2026-05-31 15:03:36'),(30,23,9,7,47,3,16,11,2,NULL,'Active',NULL,'2026-05-31 15:03:36','2026-05-31 15:03:36'),(31,23,9,7,43,3,13,9,2,NULL,'Active',NULL,'2026-05-31 15:03:36','2026-05-31 15:03:36'),(32,23,9,7,42,3,18,13,2,NULL,'Active',NULL,'2026-05-31 15:03:36','2026-05-31 15:03:36'),(33,23,9,7,44,3,19,10,2,NULL,'Active',NULL,'2026-05-31 15:03:36','2026-05-31 15:03:36');
/*!40000 ALTER TABLE `class_schedule` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `classroom_sessions`
--

DROP TABLE IF EXISTS `classroom_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `classroom_sessions` (
  `session_id` int NOT NULL AUTO_INCREMENT,
  `client_id` bigint DEFAULT NULL,
  `classroom_id` int NOT NULL,
  `teacher_id` int NOT NULL,
  `subject` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `grade` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `section` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('Active','Inactive','Cancelled') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`session_id`),
  KEY `idx_classroom_sessions_client_id` (`client_id`),
  KEY `idx_classroom_sessions_classroom_id` (`classroom_id`),
  KEY `idx_classroom_sessions_teacher_id` (`teacher_id`),
  KEY `idx_classroom_sessions_status` (`status`),
  CONSTRAINT `classroom_sessions_client_master_FK` FOREIGN KEY (`client_id`) REFERENCES `client_master` (`client_id`),
  CONSTRAINT `fk_classroom_sessions_classroom` FOREIGN KEY (`classroom_id`) REFERENCES `classrooms` (`classroom_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_classroom_sessions_teacher` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`teacher_id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `classroom_sessions`
--

LOCK TABLES `classroom_sessions` WRITE;
/*!40000 ALTER TABLE `classroom_sessions` DISABLE KEYS */;
/*!40000 ALTER TABLE `classroom_sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `classrooms`
--

DROP TABLE IF EXISTS `classrooms`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `classrooms` (
  `classroom_id` int NOT NULL AUTO_INCREMENT,
  `client_id` bigint DEFAULT NULL,
  `name` varchar(100) NOT NULL,
  `capacity` int NOT NULL,
  `facilities` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`classroom_id`),
  KEY `classrooms_client_master_FK` (`client_id`),
  CONSTRAINT `classrooms_client_master_FK` FOREIGN KEY (`client_id`) REFERENCES `client_master` (`client_id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `classrooms`
--

LOCK TABLES `classrooms` WRITE;
/*!40000 ALTER TABLE `classrooms` DISABLE KEYS */;
INSERT INTO `classrooms` VALUES (9,23,'9 st Class',100,'Class Room','2024-12-10 04:03:56','2024-12-10 04:04:46'),(10,23,'10 st Class',100,'Class Room','2024-12-10 04:03:59','2024-12-10 04:04:46');
/*!40000 ALTER TABLE `classrooms` ENABLE KEYS */;
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
INSERT INTO `client_category` VALUES (1,'HEAD','2022-10-11 22:46:05','2023-09-27 02:40:47'),(2,'SHOPPING','2022-10-11 08:16:06','2023-06-05 05:47:27'),(3,'SCHOOL','2022-10-11 08:16:16','2022-10-11 08:16:16'),(4,'SPORTS','2022-10-11 22:46:05','2023-03-15 21:55:10'),(5,'E-COMMERS','2023-05-15 01:42:48','2023-05-15 01:42:48'),(6,'PG','2023-10-06 02:39:01','2023-10-06 02:39:01'),(7,'OPTICAL','2024-02-28 22:04:56','2024-12-23 05:31:08'),(8,'MILK','2024-08-20 09:19:01','2024-10-22 06:14:39'),(9,'FINANCIAL','2025-05-30 02:53:39','2025-05-30 02:53:39');
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
  CONSTRAINT `client_master_client_category_FK` FOREIGN KEY (`category`) REFERENCES `client_category` (`id`),
  CONSTRAINT `client_master_FK` FOREIGN KEY (`category`) REFERENCES `client_category` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `client_master`
--

LOCK TABLES `client_master` WRITE;
/*!40000 ALTER TABLE `client_master` DISABLE KEYS */;
INSERT INTO `client_master` VALUES (1,'AVR GROUPS','2022-10-11 22:47:16','2024-01-02 20:51:09','DARSI',1,'https://oceanbill.s3.ap-south-1.amazonaws.com/logo.png','VENKATA REDDY','9966336638','AVREDDY.SMILE@ICLOUD.COM',NULL,NULL),(19,'SLV PG FOR MEN\'S','2024-03-24 12:27:02','2024-03-24 12:55:04','KUNDHANAHALLI',6,'https://img.staticmb.com/mbphoto/pg/grd1/cropped_images/2020/Feb/19/Photo_h400_w540/GR1-1728-276729_400_540.jpg','BHAGYA LAKSHMI','9966336638','BHAGYALAKSHMI007@GMAIL.COM',88,NULL),(20,'NEW VISION OPRICALS','2024-08-20 21:53:07','2024-12-23 05:51:49','KPHB Coloney',7,'https://www.mpl.live/blog/wp-content/uploads/2024/06/Pure-Sequence-in-Rummy.png.webp','RAMI REDDY','9966336638','newvisionopticalskphb@gmail.co',88,'36AEVPN9064J1ZL'),(21,'NANNI OPTICALS','2024-09-18 04:52:54','2024-09-19 05:33:41','KPHB Coloney',2,'https://content3.jdmagicbox.com/comp/def_content_category/sunglass-dealers-rayban/sunglass-dealers-rayban-daddy-o-sunglass-dealers-rayban-2-x7xfh.jpg','VEERU','9638527410','veerunanni@gmail.com',88,NULL),(22,'SREVEN','2024-10-22 06:16:14','2024-10-22 06:19:51','HYDERABAD',8,'https://w7.pngwing.com/pngs/600/735/png-transparent-coffee-milk-milk-bottle-milk-thumbnail.png','SREEDEVI','8341897793','',88,NULL),(23,'SRI VIVEKANDA HIGH SCHOOL','2024-12-08 00:09:24','2024-12-08 00:12:06','DARSI',3,'https://media.istockphoto.com/id/1480246301/vector/vector-illustration-of-high-school-building-vector-school-building.jpg?s=612x612&w=0&k=20&c=vR6dixHuh8Ypw1c3pjR-7ahN2V1vhCKxxTzDd7HlVbY=','RAMANJI','7894561230','srivivekandhahighschooldarsi@gmail.com',88,NULL),(24,'VIJAY REDDY','2025-05-30 02:55:23','2025-05-30 05:00:47','HYDERABAD',9,'https://cdn.vectorstock.com/i/2000v/91/46/finance-logo-design-vector-54269146.webp','VIJAY REDDY','9638527410','vijay',88,NULL);
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
  CONSTRAINT `employess_client_master_FK` FOREIGN KEY (`client_id`) REFERENCES `client_master` (`client_id`),
  CONSTRAINT `employess_FK_1` FOREIGN KEY (`category`) REFERENCES `client_category` (`id`),
  CONSTRAINT `employess_FK_3` FOREIGN KEY (`role`) REFERENCES `roles` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=128 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employess`
--

LOCK TABLES `employess` WRITE;
/*!40000 ALTER TABLE `employess` DISABLE KEYS */;
INSERT INTO `employess` VALUES (88,'teamtrack','SUPERADMIN','INTERNAL',1,'2022-12-20 21:49:36','2023-09-27 02:41:46','venkatreddybd@gmail.com','ACTIVATED',1,'9966336638','Master',NULL,1,'https://image.shutterstock.com/mosaic_250/2780032/1194497251/stock-photo-portrait-of-smiling-red-haired-millennial-man-looking-at-camera-sitting-in-caf-or-coffeeshop-1194497251.jpg'),(120,'slv-admin','MASTER','INTERNAL',19,'2024-03-24 12:28:03','2024-03-24 12:29:31','slv-admin','ACTIVATED',6,'8341897793','Others',88,2,NULL),(121,'jvvadmin','ADMIN','INTERNAL',20,'2024-08-20 21:54:08','2024-08-20 21:55:14','jvvadmin@gmail.com','ACTIVATED',8,'9966336638','',88,2,NULL),(122,'nanni','OWNER','INTERNAL',21,'2024-09-18 04:53:40','2024-09-18 04:54:07','nanni','ACTIVATED',2,'9638527410','Administrator',88,3,NULL),(123,'SURYA KUMAR','LAB INCHARGE','INTERNAL',21,'2024-09-23 10:23:31','2024-09-24 00:55:23','lab1','ACTIVATED',2,'9876543210','Purchase',122,6,NULL),(124,'sreedevi','ADMIN','INTERNAL',22,'2024-10-22 06:16:54','2024-10-22 06:17:42','sreedevi','ACTIVATED',8,'8341897793','',88,1,NULL),(125,'svh-admin','ADMIN','INTERNAL',23,'2024-12-08 00:10:34','2024-12-08 00:11:06','svhadmin@gmail.com','ACTIVATED',3,'7894561230','Administrator',88,3,NULL),(126,'ramireddy','ADMINISTRATOR','INTERNAL',20,'2024-12-23 05:34:09','2024-12-23 05:34:29','','ACTIVATED',7,'6303737517','Administrator',88,1,NULL),(127,'vijay','Admin','INTERNAL',24,'2025-05-30 02:56:22','2025-05-30 02:57:08','vijay','ACTIVATED',9,'9638527410','',88,1,NULL);
/*!40000 ALTER TABLE `employess` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `exam_results`
--

DROP TABLE IF EXISTS `exam_results`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `exam_results` (
  `exam_resu_id` int NOT NULL AUTO_INCREMENT,
  `client_id` bigint DEFAULT NULL,
  `exam_id` int NOT NULL,
  `student_id` int NOT NULL,
  `marks_obtained` int NOT NULL,
  `status` enum('PASS','FAIL','ABSENT') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`exam_resu_id`),
  KEY `exam_id` (`exam_id`),
  KEY `exam_results_client_master_FK` (`client_id`),
  CONSTRAINT `exam_results_client_master_FK` FOREIGN KEY (`client_id`) REFERENCES `client_master` (`client_id`),
  CONSTRAINT `exam_results_ibfk_1` FOREIGN KEY (`exam_id`) REFERENCES `exams` (`exam_id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `exam_results`
--

LOCK TABLES `exam_results` WRITE;
/*!40000 ALTER TABLE `exam_results` DISABLE KEYS */;
/*!40000 ALTER TABLE `exam_results` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `exams`
--

DROP TABLE IF EXISTS `exams`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `exams` (
  `exam_id` int NOT NULL AUTO_INCREMENT,
  `client_id` bigint NOT NULL,
  `subject_id` int NOT NULL,
  `exam_date` date NOT NULL,
  `total_marks` int NOT NULL,
  `passing_marks` int NOT NULL,
  `duration` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`exam_id`),
  KEY `subject_id` (`subject_id`),
  KEY `exams_client_master_FK` (`client_id`),
  CONSTRAINT `exams_client_master_FK` FOREIGN KEY (`client_id`) REFERENCES `client_master` (`client_id`),
  CONSTRAINT `exams_ibfk_1` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`subject_id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `exams`
--

LOCK TABLES `exams` WRITE;
/*!40000 ALTER TABLE `exams` DISABLE KEYS */;
INSERT INTO `exams` VALUES (10,23,38,'2026-05-20',100,35,60,'2026-05-31 05:53:19');
/*!40000 ALTER TABLE `exams` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `fee_records`
--

DROP TABLE IF EXISTS `fee_records`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fee_records` (
  `fee_id` int NOT NULL AUTO_INCREMENT,
  `client_id` bigint DEFAULT NULL,
  `fee_reg_no` varchar(20) NOT NULL,
  `student_id` int NOT NULL,
  `classroom_id` int NOT NULL,
  `fee_year` varchar(100) NOT NULL,
  `monthly_fee` decimal(10,2) DEFAULT NULL,
  `admission_fee` decimal(10,2) DEFAULT NULL,
  `registration_fee` decimal(10,2) DEFAULT NULL,
  `art_material` decimal(10,2) DEFAULT NULL,
  `transport` decimal(10,2) DEFAULT NULL,
  `books` decimal(10,2) DEFAULT NULL,
  `uniform` decimal(10,2) DEFAULT NULL,
  `fine` decimal(10,2) DEFAULT NULL,
  `others` decimal(10,2) DEFAULT NULL,
  `previous_balance` decimal(10,2) DEFAULT NULL,
  `discount` decimal(10,2) DEFAULT NULL,
  `total` decimal(10,2) DEFAULT NULL,
  `deposit` decimal(10,2) DEFAULT NULL,
  `due_balance` decimal(10,2) DEFAULT NULL,
  PRIMARY KEY (`fee_id`),
  UNIQUE KEY `student_id` (`student_id`,`fee_year`),
  KEY `classroom_id` (`classroom_id`),
  KEY `fee_records_FK` (`client_id`),
  CONSTRAINT `fee_records_client_master_FK` FOREIGN KEY (`client_id`) REFERENCES `client_master` (`client_id`),
  CONSTRAINT `fee_records_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`) ON DELETE CASCADE,
  CONSTRAINT `fee_records_ibfk_2` FOREIGN KEY (`classroom_id`) REFERENCES `classrooms` (`classroom_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fee_records`
--

LOCK TABLES `fee_records` WRITE;
/*!40000 ALTER TABLE `fee_records` DISABLE KEYS */;
/*!40000 ALTER TABLE `fee_records` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `hostel_payments`
--

DROP TABLE IF EXISTS `hostel_payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hostel_payments` (
  `payment_id` int NOT NULL AUTO_INCREMENT,
  `client_id` bigint DEFAULT NULL,
  `assignment_id` int NOT NULL,
  `student_id` int NOT NULL,
  `room_id` int NOT NULL,
  `receipt_no` varchar(30) NOT NULL,
  `payment_date` date NOT NULL,
  `payment_type` varchar(20) DEFAULT 'PARTIAL',
  `payment_mode` varchar(30) DEFAULT 'Cash',
  `amount` decimal(10,2) NOT NULL DEFAULT '0.00',
  `notes` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`payment_id`),
  UNIQUE KEY `receipt_no` (`receipt_no`),
  KEY `hostel_payments_client_idx` (`client_id`),
  KEY `hostel_payments_assignment_idx` (`assignment_id`),
  KEY `hostel_payments_student_idx` (`student_id`),
  KEY `hostel_payments_room_idx` (`room_id`),
  CONSTRAINT `hostel_payments_client_master_FK` FOREIGN KEY (`client_id`) REFERENCES `client_master` (`client_id`),
  CONSTRAINT `hostel_payments_students_FK` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `hostel_payments`
--

LOCK TABLES `hostel_payments` WRITE;
/*!40000 ALTER TABLE `hostel_payments` DISABLE KEYS */;
/*!40000 ALTER TABLE `hostel_payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `hostel_rooms`
--

DROP TABLE IF EXISTS `hostel_rooms`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hostel_rooms` (
  `room_id` int NOT NULL AUTO_INCREMENT,
  `client_id` bigint DEFAULT NULL,
  `room_number` varchar(10) NOT NULL,
  `capacity` int NOT NULL,
  `current_occupancy` int DEFAULT '0',
  `gender_specific` enum('Male','Female','Unisex') NOT NULL,
  `fee` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`room_id`),
  UNIQUE KEY `room_number` (`room_number`),
  KEY `hostel_rooms_FK` (`client_id`),
  CONSTRAINT `hostel_rooms_client_master_FK` FOREIGN KEY (`client_id`) REFERENCES `client_master` (`client_id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `hostel_rooms`
--

LOCK TABLES `hostel_rooms` WRITE;
/*!40000 ALTER TABLE `hostel_rooms` DISABLE KEYS */;
/*!40000 ALTER TABLE `hostel_rooms` ENABLE KEYS */;
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
  CONSTRAINT `login_branch_FK` FOREIGN KEY (`branch_id`) REFERENCES `branch` (`id`),
  CONSTRAINT `login_client_category_FK` FOREIGN KEY (`category`) REFERENCES `client_category` (`id`),
  CONSTRAINT `login_client_master_FK` FOREIGN KEY (`client_id`) REFERENCES `client_master` (`client_id`),
  CONSTRAINT `login_employess_FK` FOREIGN KEY (`emp_id`) REFERENCES `employess` (`emp_id`),
  CONSTRAINT `login_employess_FK_1` FOREIGN KEY (`created_by`) REFERENCES `employess` (`emp_id`)
) ENGINE=InnoDB AUTO_INCREMENT=64 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `login`
--

LOCK TABLES `login` WRITE;
/*!40000 ALTER TABLE `login` DISABLE KEYS */;
INSERT INTO `login` VALUES (1,'teamtrack','d70142594d0cda295f4313b720473cb46b533db33871b8aa3dac3a6ea8b7f1af45d1d1623f21b697fd05cda5287bbc82911fa653b4414591114c9a412da390cb','0b44c34c96aebf7','venkat reddy','PRESENDENT','INTERNAL',1,'2025-06-19 21:21:55','2022-03-03 23:02:48','2025-06-19 21:21:55',88,88,'ACTIVATED',1,1,NULL,NULL),(43,'slv-admin','d70142594d0cda295f4313b720473cb46b533db33871b8aa3dac3a6ea8b7f1af45d1d1623f21b697fd05cda5287bbc82911fa653b4414591114c9a412da390cb','0b44c34c96aebf7','slv-admin','MASTER','INTERNAL',19,'2025-09-16 21:50:11','2024-03-24 12:28:03','2025-09-16 21:50:11',88,120,'ACTIVATED',6,2,'jInMZuVxp5',NULL),(44,'jvvadmin@gmail.com','1e2c306e3eeeda367bef7f51a3100e0c963164a6415ff91802260e923d0132c16ecb42de610d95c5baf1cb4f6a28d1a28454aad8b1eb822e456107d866749b5b','001564233b0f1f8','jvvadmin','ADMIN','INTERNAL',20,'2026-05-22 21:11:39','2024-08-20 21:54:08','2026-05-22 21:11:39',88,121,'ACTIVATED',8,2,'UiLEK6lHxG',NULL),(45,'nanni','eea6048d9f692313c614aa938d9ab4906ab0326e4f72341519fef30310e8a94203f0d2aa6296f0535558d46a80e1a2aceb6411cbb0ef06b2c442e1717f759f71','9d07269c5f34a62','nanni','OWNER','INTERNAL',21,'2024-12-23 05:50:38','2024-09-18 04:53:40','2024-12-23 05:50:38',88,122,'ACTIVATED',2,3,'3sWa3qd6QZ',NULL),(46,'lab1','d5d6f47f15111d6198cfc2da74c7101c616c1aa787912317f64ba6ec247479c691591e80b9b1ff71379015860d4a624da40249b478ed44422400a707a5bba23f','16aaa750bb10044','SURYA KUMAR','LAB INCHARGE','INTERNAL',21,'2024-09-24 00:54:47','2024-09-23 10:23:31','2024-09-24 00:54:47',122,123,'ACTIVATED',2,6,'3JUk2hWLVk',NULL),(47,'sreedevi','f98428a0af745e567196152bfafb363bea7019193b1b47a99efa124249cd7f8cfd0abac3de4bea9d0f00b1b05ee6c5db7ab6d7aedd4982c56fa7f94cab42e161','95832797bcae19f','sreedevi','ADMIN','INTERNAL',22,'2024-12-23 04:44:56','2024-10-22 06:16:54','2024-12-23 04:44:56',88,124,'ACTIVATED',8,1,'Pkgpaxxat1',NULL),(48,'svhadmin@gmail.com','1106c85faa5fe847dd8d3baeedcd459450be5a72100e9960d3127dcb03a921012587652ae35a4bc8e59d7750ebfea1dcbf078f3ebe9bf443efb64665f88d9cb9','3bc2b1a4a4f72db','svh-admin','ADMIN','INTERNAL',23,'2026-06-01 14:30:23','2024-12-08 00:10:34','2026-06-01 14:30:23',88,125,'ACTIVATED',3,3,'yoLpAVieR5',NULL),(49,'ramireddy','7460ae7c2cf79289e64da099d5a542eeabad07e7ad7a9a7e9fe0c080f53c8b0b740346316d52ce3a87be2119d34aae22756e9dbd0568674fc9667dd65deee87d','17a8a5ea1534048','ramireddy','ADMINISTRATOR','INTERNAL',20,'2025-01-15 12:21:40','2024-12-23 05:34:09','2025-01-15 12:21:40',88,126,'ACTIVATED',7,1,'QWUKfI4ENq',NULL),(50,'vijay@tt.com','dd4be886d9633a021fa1a9ebc440805a70ace8902afa8357d8656ee9a93d99c37c80b849d95fe3ffc53c4f334168157022de23c3c1732d4c812e8c90f93053e0','b54282c779f68c3','vijay','Admin','INTERNAL',24,'2025-10-16 06:57:22','2025-05-30 02:56:22','2025-10-16 06:57:22',88,127,'ACTIVATED',9,1,'XixFXdcwd0',NULL),(57,'kasireddymunagala@gmail.com','32c0772f6d7811f8471e5ae8f67e0fa9be2e9ddee697d64048e9f309cb31d84c4e2cfc26753ca70f36f40b0bb91def9bc188601d0fd0f8f2f78c3f8479a30209','10a642ca6077608','KASIRATNA REDDY','Parent','PARENT',23,'2026-05-30 19:20:48','2026-05-30 19:20:48','2026-05-30 19:20:48',NULL,NULL,'ACTIVATED',3,11,NULL,NULL),(58,'SREEVENKAT0804@GMAIL.COM','5289faca5f5acde080cac158b739e498e8adc7713aad4d33855e65ac3cb4fb5ff11ef1a5f1660280b1a11cb53f0b4d29386938e55df98a4cc82f018199060384','7e0548ca51aaaef','SREEDEVI ANNAREDDY','Teacher','TEACHER',23,'2026-05-31 23:41:59','2026-05-30 19:36:24','2026-05-31 23:41:59',NULL,NULL,'ACTIVATED',3,10,NULL,NULL),(59,'saivivek1994@gmail.com','864498a698d033a1e53e7879dace4d216589f5ef78b716501ee73c5bb4f37ec384b55a22230e2effd0d4bcae266212aca76f196de1628797cde00b5e3607d843','291bc3f47144465','VIVEKANADAN REDDY YERUVA','Teacher','TEACHER',23,'2026-05-30 22:21:23','2026-05-30 22:21:23','2026-05-30 22:21:23',NULL,NULL,'ACTIVATED',3,10,NULL,NULL),(60,'raviteja1993@gmail.com','84806780148c56aecdb54b10d16808f5481029be8dd253551ce2312f3d864c1d038f416639def92b87eb802c0ecb06cd7e6d4602fddb2c3d07a244edc6eb4bf6','94b8f8af5bcec49','RAVITEJA MADASU','Teacher','TEACHER',23,'2026-05-30 22:22:26','2026-05-30 22:22:26','2026-05-30 22:22:26',NULL,NULL,'ACTIVATED',3,10,NULL,NULL),(61,'harikrishna.k@gmail.com','cf5145928f428880b1efe14cd69d803b0dac58e6edcffac9a2ac5e3a460b9e760bfdf0484201a455cc95303f2a7a08f4eeba5f918c4a3cdf5fb3a4c909ace413','5b47f633d37db57','HARI KRISHNA K','Teacher','TEACHER',23,'2026-05-30 22:23:47','2026-05-30 22:23:47','2026-05-30 22:23:47',NULL,NULL,'ACTIVATED',3,10,NULL,NULL),(62,'kasimsaheb.sirichapala@gmail.com','c428371c600c13d163a7d132333ab32bf0cc2fae0f4a8b2a77e03348e5ac1383569d9b6e123d04c55a7e1b13500213b2b679ef8b94c8879a00960b00087d9f78','2b216c9ca757cd3','KASIM SAHEB SIRICHAPALA','Teacher','TEACHER',23,'2026-05-31 12:42:30','2026-05-30 22:24:51','2026-05-31 12:42:30',NULL,NULL,'ACTIVATED',3,10,NULL,NULL),(63,'SIVAREDDYENAKONDA@GMAIL.COM','32b7fc8ed1c2f87a96bb2f84522746fb86941fa2a363e9e32bb8ff5851b455b4cf82e259e02ba3f1c970d230dabd008703aaedd96efa2766f97b7e7fd7b01ac5','39909a82c7711a0','SIVAREDDY E','Teacher','TEACHER',23,'2026-05-30 22:26:16','2026-05-30 22:26:16','2026-05-30 22:26:16',NULL,NULL,'ACTIVATED',3,10,NULL,NULL);
/*!40000 ALTER TABLE `login` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `parent_student_links`
--

DROP TABLE IF EXISTS `parent_student_links`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `parent_student_links` (
  `id` int NOT NULL AUTO_INCREMENT,
  `client_id` bigint NOT NULL,
  `parent_login_id` int NOT NULL,
  `student_id` int NOT NULL,
  `relationship` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `parent_student_links_client_master_FK` (`client_id`),
  CONSTRAINT `parent_student_links_client_master_FK` FOREIGN KEY (`client_id`) REFERENCES `client_master` (`client_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `parent_student_links`
--

LOCK TABLES `parent_student_links` WRITE;
/*!40000 ALTER TABLE `parent_student_links` DISABLE KEYS */;
INSERT INTO `parent_student_links` VALUES (2,23,57,42,'FATHER');
/*!40000 ALTER TABLE `parent_student_links` ENABLE KEYS */;
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
  CONSTRAINT `roles_client_master_FK` FOREIGN KEY (`client_id`) REFERENCES `client_master` (`client_id`),
  CONSTRAINT `roles_chk_1` CHECK (json_valid(`navbar`))
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES (1,1,'ADMINISTRATOR','2023-02-04 22:47:49','2023-02-19 11:20:45','{\"navbar\": [{\"id\": \"dashboard\", \"icon\": \"feather icon-star\", \"type\": \"group\", \"title\": \"Dashboard\", \"children\": [{\"id\": \"home\", \"url\": \"/dashboard/default\", \"icon\": \"feather icon-home\", \"type\": \"item\", \"title\": \"Home\", \"classes\": \"nav-item\"}]}, {\"id\": \"parties\", \"url\": \"/parties\", \"icon\": \"feather icon-user\", \"type\": \"item\", \"title\": \"Parties\", \"classes\": \"nav-item\"}, {\"id\": \"admin\", \"icon\": \"feather icon-box\", \"type\": \"collapse\", \"title\": \"Admin Dashboard\", \"children\": [{\"id\": \"core\", \"url\": \"/admin/categoryList\", \"icon\": \"feather icon-list\", \"type\": \"item\", \"title\": \"Core Data\", \"classes\": \"nav-item\"}, {\"id\": \"branch\", \"url\": \"/admin/branchList\", \"icon\": \"feather icon-home\", \"type\": \"item\", \"title\": \"Branch\", \"classes\": \"nav-item\"}, {\"id\": \"employees\", \"url\": \"/admin/employeeList\", \"icon\": \"feather icon-user\", \"type\": \"item\", \"title\": \"Employees\", \"classes\": \"nav-item\"}, {\"id\": \"vendor\", \"url\": \"/admin/vendor\", \"icon\": \"feather icon-box\", \"type\": \"item\", \"title\": \"Vendor\", \"classes\": \"nav-item\"}, {\"id\": \"clients\", \"url\": \"/admin/clients-list\", \"icon\": \"feather icon-users\", \"type\": \"item\", \"title\": \"Clients\", \"classes\": \"nav-item\"}]}, {\"id\": \"product\", \"icon\": \"feather icon-map\", \"type\": \"collapse\", \"title\": \"Products\", \"children\": [{\"id\": \"productslist\", \"url\": \"/products/productList\", \"icon\": \"feather icon-list\", \"type\": \"item\", \"title\": \"Product List\", \"classes\": \"nav-item\"}]}, {\"id\": \"sales\", \"icon\": \"feather icon-star\", \"type\": \"collapse\", \"title\": \"Sales\", \"children\": [{\"id\": \"invoice\", \"url\": \"/sales/invoiceList\", \"icon\": \"feather icon-file\", \"type\": \"item\", \"title\": \"Invoice\", \"classes\": \"nav-item\"}]}, {\"id\": \"purchase\", \"icon\": \"feather icon-server\", \"type\": \"collapse\", \"title\": \"Purchase\", \"children\": [{\"id\": \"purchaselist\", \"url\": \"/purchase/purchase-list\", \"icon\": \"feather icon-list\", \"type\": \"item\", \"title\": \"Purchase List\", \"classes\": \"nav-item\"}]}, {\"id\": \"Cash & Bank\", \"url\": \"/cash&bank/list\", \"icon\": \"feather icon-home\", \"type\": \"item\", \"title\": \"Cash & Bank\", \"classes\": \"nav-item\"}, {\"id\": \"Expenses\", \"url\": \"/expenses/expenses-list\", \"icon\": \"feather icon-layers\", \"type\": \"item\", \"title\": \"Expenses\", \"classes\": \"nav-item\"}, {\"id\": \"Reports\", \"url\": \"/reports/\", \"icon\": \"feather icon-inbox\", \"type\": \"item\", \"title\": \"Reports\", \"classes\": \"nav-item\"}, {\"id\": \"settings\", \"icon\": \"feather icon-settings\", \"type\": \"collapse\", \"title\": \"Settings\", \"children\": [{\"id\": \"company profile\", \"url\": \"/settings/company-profile\", \"icon\": \"feather icon-book\", \"type\": \"item\", \"title\": \"Company profile\", \"classes\": \"nav-item\"}, {\"id\": \"User Roles\", \"url\": \"/settings/user-roles\", \"icon\": \"feather icon-users\", \"type\": \"item\", \"title\": \"User Roles\", \"classes\": \"nav-item\"}]}, {\"id\": \"ui-element\", \"icon\": \"feather icon-layers\", \"type\": \"group\", \"title\": \"UI ELEMENT\", \"children\": [{\"id\": \"basic\", \"icon\": \"feather icon-box\", \"type\": \"collapse\", \"title\": \"Basic\", \"children\": [{\"id\": \"button\", \"url\": \"/basic/button\", \"type\": \"item\", \"title\": \"Button\"}, {\"id\": \"cards\", \"url\": \"/basic/cards\", \"type\": \"item\", \"title\": \"Cards\"}, {\"id\": \"tabs-pills\", \"url\": \"/basic/tabs-pills\", \"type\": \"item\", \"title\": \"Tabs & Pills\"}, {\"id\": \"other\", \"url\": \"/basic/other\", \"type\": \"item\", \"title\": \"Other\"}]}]}]}'),(2,NULL,'MASTER','2023-02-04 22:47:55','2023-02-20 04:22:29','{\"navbar\": [{\"id\": \"dashboard\", \"icon\": \"feather icon-star\", \"type\": \"group\", \"title\": \"Dashboard\", \"children\": [{\"id\": \"home\", \"url\": \"/dashboard/default\", \"icon\": \"feather icon-home\", \"type\": \"item\", \"title\": \"Home\", \"classes\": \"nav-item\"}]}, {\"id\": \"parties\", \"url\": \"/parties\", \"icon\": \"feather icon-user\", \"type\": \"item\", \"title\": \"Parties\", \"classes\": \"nav-item\"}, {\"id\": \"admin\", \"icon\": \"feather icon-box\", \"type\": \"collapse\", \"title\": \"Admin Dashboard\", \"children\": [{\"id\": \"core\", \"url\": \"/admin/categoryList\", \"icon\": \"feather icon-list\", \"type\": \"item\", \"title\": \"Core Data\", \"classes\": \"nav-item\"}, {\"id\": \"branch\", \"url\": \"/admin/branchList\", \"icon\": \"feather icon-home\", \"type\": \"item\", \"title\": \"Branch\", \"classes\": \"nav-item\"}, {\"id\": \"employees\", \"url\": \"/admin/employeeList\", \"icon\": \"feather icon-user\", \"type\": \"item\", \"title\": \"Employees\", \"classes\": \"nav-item\"}, {\"id\": \"vendor\", \"url\": \"/admin/vendor\", \"icon\": \"feather icon-box\", \"type\": \"item\", \"title\": \"Vendor\", \"classes\": \"nav-item\"}]}, {\"id\": \"product\", \"icon\": \"feather icon-map\", \"type\": \"collapse\", \"title\": \"Products\", \"children\": [{\"id\": \"productslist\", \"url\": \"/products/productList\", \"icon\": \"feather icon-list\", \"type\": \"item\", \"title\": \"Product List\", \"classes\": \"nav-item\"}]}, {\"id\": \"sales\", \"icon\": \"feather icon-star\", \"type\": \"collapse\", \"title\": \"Sales\", \"children\": [{\"id\": \"invoice\", \"url\": \"/sales/invoiceList\", \"icon\": \"feather icon-file\", \"type\": \"item\", \"title\": \"Invoice\", \"classes\": \"nav-item\"}]}, {\"id\": \"purchase\", \"icon\": \"feather icon-server\", \"type\": \"collapse\", \"title\": \"Purchase\", \"children\": [{\"id\": \"purchaselist\", \"url\": \"/purchase/purchase-list\", \"icon\": \"feather icon-list\", \"type\": \"item\", \"title\": \"Purchase List\", \"classes\": \"nav-item\"}]}, {\"id\": \"Cash & Bank\", \"url\": \"/cash&bank/list\", \"icon\": \"feather icon-home\", \"type\": \"item\", \"title\": \"Cash & Bank\", \"classes\": \"nav-item\"}, {\"id\": \"Expenses\", \"url\": \"/expenses/expenses-list\", \"icon\": \"feather icon-layers\", \"type\": \"item\", \"title\": \"Expenses\", \"classes\": \"nav-item\"}, {\"id\": \"Reports\", \"url\": \"/reports/\", \"icon\": \"feather icon-inbox\", \"type\": \"item\", \"title\": \"Reports\", \"classes\": \"nav-item\"}, {\"id\": \"settings\", \"icon\": \"feather icon-settings\", \"type\": \"collapse\", \"title\": \"Settings\", \"children\": [{\"id\": \"company profile\", \"url\": \"/settings/company-profile\", \"icon\": \"feather icon-book\", \"type\": \"item\", \"title\": \"Company profile\", \"classes\": \"nav-item\"}, {\"id\": \"User Roles\", \"url\": \"/settings/user-roles\", \"icon\": \"feather icon-users\", \"type\": \"item\", \"title\": \"User Roles\", \"classes\": \"nav-item\"}, {\"id\": \"Accounts\", \"url\": \"/settings/accounts\", \"icon\": \"feather icon-cash\", \"type\": \"item\", \"title\": \"Accounts\", \"classes\": \"nav-item\"}]}]}'),(3,NULL,'ADMIN','2023-02-04 22:48:04','2023-02-20 04:22:29','{\"navbar\": [{\"id\": \"dashboard\", \"icon\": \"feather icon-star\", \"type\": \"group\", \"title\": \"Dashboard\", \"children\": [{\"id\": \"home\", \"url\": \"/dashboard/default\", \"icon\": \"feather icon-home\", \"type\": \"item\", \"title\": \"Home\", \"classes\": \"nav-item\"}]}, {\"id\": \"parties\", \"url\": \"/parties\", \"icon\": \"feather icon-user\", \"type\": \"item\", \"title\": \"Parties\", \"classes\": \"nav-item\"}, {\"id\": \"admin\", \"icon\": \"feather icon-box\", \"type\": \"collapse\", \"title\": \"Admin Dashboard\", \"children\": [{\"id\": \"core\", \"url\": \"/admin/categoryList\", \"icon\": \"feather icon-list\", \"type\": \"item\", \"title\": \"Core Data\", \"classes\": \"nav-item\"}, {\"id\": \"branch\", \"url\": \"/admin/branchList\", \"icon\": \"feather icon-home\", \"type\": \"item\", \"title\": \"Branch\", \"classes\": \"nav-item\"}, {\"id\": \"employees\", \"url\": \"/admin/employeeList\", \"icon\": \"feather icon-user\", \"type\": \"item\", \"title\": \"Employees\", \"classes\": \"nav-item\"}, {\"id\": \"vendor\", \"url\": \"/admin/vendor\", \"icon\": \"feather icon-box\", \"type\": \"item\", \"title\": \"Vendor\", \"classes\": \"nav-item\"}]}, {\"id\": \"product\", \"icon\": \"feather icon-map\", \"type\": \"collapse\", \"title\": \"Products\", \"children\": [{\"id\": \"productslist\", \"url\": \"/products/productList\", \"icon\": \"feather icon-list\", \"type\": \"item\", \"title\": \"Product List\", \"classes\": \"nav-item\"}]}, {\"id\": \"sales\", \"icon\": \"feather icon-star\", \"type\": \"collapse\", \"title\": \"Sales\", \"children\": [{\"id\": \"invoice\", \"url\": \"/sales/invoiceList\", \"icon\": \"feather icon-file\", \"type\": \"item\", \"title\": \"Invoice\", \"classes\": \"nav-item\"}]}, {\"id\": \"purchase\", \"icon\": \"feather icon-server\", \"type\": \"collapse\", \"title\": \"Purchase\", \"children\": [{\"id\": \"purchaselist\", \"url\": \"/purchase/purchase-list\", \"icon\": \"feather icon-list\", \"type\": \"item\", \"title\": \"Purchase List\", \"classes\": \"nav-item\"}]}, {\"id\": \"Cash & Bank\", \"url\": \"/cash&bank/list\", \"icon\": \"feather icon-home\", \"type\": \"item\", \"title\": \"Cash & Bank\", \"classes\": \"nav-item\"}, {\"id\": \"Expenses\", \"url\": \"/expenses/expenses-list\", \"icon\": \"feather icon-layers\", \"type\": \"item\", \"title\": \"Expenses\", \"classes\": \"nav-item\"}, {\"id\": \"Reports\", \"url\": \"/reports/\", \"icon\": \"feather icon-inbox\", \"type\": \"item\", \"title\": \"Reports\", \"classes\": \"nav-item\"}, {\"id\": \"settings\", \"icon\": \"feather icon-settings\", \"type\": \"collapse\", \"title\": \"Settings\", \"children\": [{\"id\": \"company profile\", \"url\": \"/settings/company-profile\", \"icon\": \"feather icon-book\", \"type\": \"item\", \"title\": \"Company profile\", \"classes\": \"nav-item\"}, {\"id\": \"User Roles\", \"url\": \"/settings/user-roles\", \"icon\": \"feather icon-users\", \"type\": \"item\", \"title\": \"User Roles\", \"classes\": \"nav-item\"}, {\"id\": \"Accounts\", \"url\": \"/settings/accounts\", \"icon\": \"feather icon-cash\", \"type\": \"item\", \"title\": \"Accounts\", \"classes\": \"nav-item\"}]}]}'),(4,NULL,'BRANCH MANAGER','2023-02-04 22:48:14','2023-02-20 00:48:49','{\"navbar\": [{\"id\": \"dashboard\", \"icon\": \"feather icon-star\", \"type\": \"group\", \"title\": \"Dashboard\", \"children\": [{\"id\": \"home\", \"url\": \"/dashboard/default\", \"icon\": \"feather icon-home\", \"type\": \"item\", \"title\": \"Home\", \"classes\": \"nav-item\"}]}, {\"id\": \"parties\", \"url\": \"/parties\", \"icon\": \"feather icon-user\", \"type\": \"item\", \"title\": \"Parties\", \"classes\": \"nav-item\"}, {\"id\": \"admin\", \"icon\": \"feather icon-box\", \"type\": \"collapse\", \"title\": \"Admin Dashboard\", \"children\": [{\"id\": \"core\", \"url\": \"/admin/categoryList\", \"icon\": \"feather icon-list\", \"type\": \"item\", \"title\": \"Core Data\", \"classes\": \"nav-item\"}, {\"id\": \"employees\", \"url\": \"/admin/employeeList\", \"icon\": \"feather icon-user\", \"type\": \"item\", \"title\": \"Employees\", \"classes\": \"nav-item\"}, {\"id\": \"vendor\", \"url\": \"/admin/vendor\", \"icon\": \"feather icon-box\", \"type\": \"item\", \"title\": \"Vendor\", \"classes\": \"nav-item\"}]}, {\"id\": \"product\", \"icon\": \"feather icon-map\", \"type\": \"collapse\", \"title\": \"Products\", \"children\": [{\"id\": \"productslist\", \"url\": \"/products/productList\", \"icon\": \"feather icon-list\", \"type\": \"item\", \"title\": \"Product List\", \"classes\": \"nav-item\"}]}, {\"id\": \"sales\", \"icon\": \"feather icon-star\", \"type\": \"collapse\", \"title\": \"Sales\", \"children\": [{\"id\": \"invoice\", \"url\": \"/sales/invoiceList\", \"icon\": \"feather icon-file\", \"type\": \"item\", \"title\": \"Invoice\", \"classes\": \"nav-item\"}]}, {\"id\": \"purchase\", \"icon\": \"feather icon-server\", \"type\": \"collapse\", \"title\": \"Purchase\", \"children\": [{\"id\": \"purchaselist\", \"url\": \"/purchase/purchase-list\", \"icon\": \"feather icon-list\", \"type\": \"item\", \"title\": \"Purchase List\", \"classes\": \"nav-item\"}]}, {\"id\": \"Cash & Bank\", \"url\": \"/cash&bank/list\", \"icon\": \"feather icon-home\", \"type\": \"item\", \"title\": \"Cash & Bank\", \"classes\": \"nav-item\"}, {\"id\": \"Expenses\", \"url\": \"/expenses/expenses-list\", \"icon\": \"feather icon-layers\", \"type\": \"item\", \"title\": \"Expenses\", \"classes\": \"nav-item\"}, {\"id\": \"Reports\", \"url\": \"/reports/\", \"icon\": \"feather icon-inbox\", \"type\": \"item\", \"title\": \"Reports\", \"classes\": \"nav-item\"}, {\"id\": \"settings\", \"icon\": \"feather icon-settings\", \"type\": \"collapse\", \"title\": \"Settings\", \"children\": [{\"id\": \"company profile\", \"url\": \"/settings/company-profile\", \"icon\": \"feather icon-book\", \"type\": \"item\", \"title\": \"Company profile\", \"classes\": \"nav-item\"}, {\"id\": \"User Roles\", \"url\": \"/settings/user-roles\", \"icon\": \"feather icon-users\", \"type\": \"item\", \"title\": \"User Roles\", \"classes\": \"nav-item\"}]}]}'),(5,NULL,'MANAGER','2023-02-04 22:48:23','2023-02-20 00:48:49','{\"navbar\": [{\"id\": \"dashboard\", \"icon\": \"feather icon-star\", \"type\": \"group\", \"title\": \"Dashboard\", \"children\": [{\"id\": \"home\", \"url\": \"/dashboard/default\", \"icon\": \"feather icon-home\", \"type\": \"item\", \"title\": \"Home\", \"classes\": \"nav-item\"}]}, {\"id\": \"parties\", \"url\": \"/parties\", \"icon\": \"feather icon-user\", \"type\": \"item\", \"title\": \"Parties\", \"classes\": \"nav-item\"}, {\"id\": \"admin\", \"icon\": \"feather icon-box\", \"type\": \"collapse\", \"title\": \"Admin Dashboard\", \"children\": [{\"id\": \"core\", \"url\": \"/admin/categoryList\", \"icon\": \"feather icon-list\", \"type\": \"item\", \"title\": \"Core Data\", \"classes\": \"nav-item\"}, {\"id\": \"employees\", \"url\": \"/admin/employeeList\", \"icon\": \"feather icon-user\", \"type\": \"item\", \"title\": \"Employees\", \"classes\": \"nav-item\"}, {\"id\": \"vendor\", \"url\": \"/admin/vendor\", \"icon\": \"feather icon-box\", \"type\": \"item\", \"title\": \"Vendor\", \"classes\": \"nav-item\"}]}, {\"id\": \"product\", \"icon\": \"feather icon-map\", \"type\": \"collapse\", \"title\": \"Products\", \"children\": [{\"id\": \"productslist\", \"url\": \"/products/productList\", \"icon\": \"feather icon-list\", \"type\": \"item\", \"title\": \"Product List\", \"classes\": \"nav-item\"}]}, {\"id\": \"sales\", \"icon\": \"feather icon-star\", \"type\": \"collapse\", \"title\": \"Sales\", \"children\": [{\"id\": \"invoice\", \"url\": \"/sales/invoiceList\", \"icon\": \"feather icon-file\", \"type\": \"item\", \"title\": \"Invoice\", \"classes\": \"nav-item\"}]}, {\"id\": \"purchase\", \"icon\": \"feather icon-server\", \"type\": \"collapse\", \"title\": \"Purchase\", \"children\": [{\"id\": \"purchaselist\", \"url\": \"/purchase/purchase-list\", \"icon\": \"feather icon-list\", \"type\": \"item\", \"title\": \"Purchase List\", \"classes\": \"nav-item\"}]}, {\"id\": \"Cash & Bank\", \"url\": \"/cash&bank/list\", \"icon\": \"feather icon-home\", \"type\": \"item\", \"title\": \"Cash & Bank\", \"classes\": \"nav-item\"}, {\"id\": \"Expenses\", \"url\": \"/expenses/expenses-list\", \"icon\": \"feather icon-layers\", \"type\": \"item\", \"title\": \"Expenses\", \"classes\": \"nav-item\"}, {\"id\": \"Reports\", \"url\": \"/reports/\", \"icon\": \"feather icon-inbox\", \"type\": \"item\", \"title\": \"Reports\", \"classes\": \"nav-item\"}, {\"id\": \"settings\", \"icon\": \"feather icon-settings\", \"type\": \"collapse\", \"title\": \"Settings\", \"children\": [{\"id\": \"company profile\", \"url\": \"/settings/company-profile\", \"icon\": \"feather icon-book\", \"type\": \"item\", \"title\": \"Company profile\", \"classes\": \"nav-item\"}, {\"id\": \"User Roles\", \"url\": \"/settings/user-roles\", \"icon\": \"feather icon-users\", \"type\": \"item\", \"title\": \"User Roles\", \"classes\": \"nav-item\"}]}]}'),(6,NULL,'STUDENT','2023-02-04 22:48:37','2026-05-26 04:16:04','{\"navbar\": [{\"id\": \"dashboard\", \"icon\": \"feather icon-star\", \"type\": \"group\", \"title\": \"Dashboard\", \"children\": [{\"id\": \"home\", \"url\": \"/dashboard/default\", \"icon\": \"feather icon-home\", \"type\": \"item\", \"title\": \"Home\", \"classes\": \"nav-item\"}]}, {\"id\": \"parties\", \"url\": \"/parties\", \"icon\": \"feather icon-user\", \"type\": \"item\", \"title\": \"Parties\", \"classes\": \"nav-item\"}, {\"id\": \"product\", \"icon\": \"feather icon-map\", \"type\": \"collapse\", \"title\": \"Products\", \"children\": [{\"id\": \"productslist\", \"url\": \"/products/productList\", \"icon\": \"feather icon-list\", \"type\": \"item\", \"title\": \"Product List\", \"classes\": \"nav-item\"}]}, {\"id\": \"sales\", \"icon\": \"feather icon-star\", \"type\": \"collapse\", \"title\": \"Sales\", \"children\": [{\"id\": \"invoice\", \"url\": \"/sales/invoiceList\", \"icon\": \"feather icon-file\", \"type\": \"item\", \"title\": \"Invoice\", \"classes\": \"nav-item\"}]}, {\"id\": \"Cash & Bank\", \"url\": \"/cash&bank/list\", \"icon\": \"feather icon-home\", \"type\": \"item\", \"title\": \"Cash & Bank\", \"classes\": \"nav-item\"}, {\"id\": \"Expenses\", \"url\": \"/expenses/expenses-list\", \"icon\": \"feather icon-layers\", \"type\": \"item\", \"title\": \"Expenses\", \"classes\": \"nav-item\"}]}'),(7,NULL,'TEACHER','2023-02-04 22:48:47','2026-05-25 20:20:09',NULL),(8,NULL,'ACCOUNT MANAGER','2023-02-04 22:48:59','2023-02-20 00:48:49','{\"navbar\": [{\"id\": \"dashboard\", \"icon\": \"feather icon-star\", \"type\": \"group\", \"title\": \"Dashboard\", \"children\": [{\"id\": \"home\", \"url\": \"/dashboard/default\", \"icon\": \"feather icon-home\", \"type\": \"item\", \"title\": \"Home\", \"classes\": \"nav-item\"}]}, {\"id\": \"Reports\", \"url\": \"/reports/\", \"icon\": \"feather icon-inbox\", \"type\": \"item\", \"title\": \"Reports\", \"classes\": \"nav-item\"}]}'),(9,NULL,'ACCOUNTENT','2023-02-04 22:49:10','2023-02-20 00:48:49','{\"navbar\": [{\"id\": \"dashboard\", \"icon\": \"feather icon-star\", \"type\": \"group\", \"title\": \"Dashboard\", \"children\": [{\"id\": \"home\", \"url\": \"/dashboard/default\", \"icon\": \"feather icon-home\", \"type\": \"item\", \"title\": \"Home\", \"classes\": \"nav-item\"}]}, {\"id\": \"Reports\", \"url\": \"/reports/\", \"icon\": \"feather icon-inbox\", \"type\": \"item\", \"title\": \"Reports\", \"classes\": \"nav-item\"}]}'),(10,23,'TEACHER','2026-05-25 20:13:11','2026-05-25 20:13:11','{\"navbar\":[]}'),(11,23,'PARENT','2026-05-26 04:15:19','2026-05-26 04:15:19','{\"navbar\":[]}');
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `school_sessions`
--

DROP TABLE IF EXISTS `school_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `school_sessions` (
  `session_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `sort_order` int NOT NULL DEFAULT '1',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`session_id`),
  UNIQUE KEY `uq_school_sessions_name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `school_sessions`
--

LOCK TABLES `school_sessions` WRITE;
/*!40000 ALTER TABLE `school_sessions` DISABLE KEYS */;
INSERT INTO `school_sessions` VALUES (3,'Regular Day',1,1,'2026-05-31 01:47:04','2026-05-31 01:47:04');
/*!40000 ALTER TABLE `school_sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `seating_arrangements`
--

DROP TABLE IF EXISTS `seating_arrangements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `seating_arrangements` (
  `id` int NOT NULL AUTO_INCREMENT,
  `classroom_id` int DEFAULT NULL,
  `seat_number` varchar(10) DEFAULT NULL,
  `student_id` int DEFAULT NULL,
  `teacher_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `classroom_id` (`classroom_id`),
  KEY `student_id` (`student_id`),
  KEY `teacher_id` (`teacher_id`),
  CONSTRAINT `seating_arrangements_ibfk_1` FOREIGN KEY (`classroom_id`) REFERENCES `classrooms` (`classroom_id`),
  CONSTRAINT `seating_arrangements_ibfk_2` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`),
  CONSTRAINT `seating_arrangements_ibfk_3` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`teacher_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `seating_arrangements`
--

LOCK TABLES `seating_arrangements` WRITE;
/*!40000 ALTER TABLE `seating_arrangements` DISABLE KEYS */;
/*!40000 ALTER TABLE `seating_arrangements` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sections`
--

DROP TABLE IF EXISTS `sections`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sections` (
  `section_id` int NOT NULL AUTO_INCREMENT,
  `client_id` bigint DEFAULT NULL,
  `classroom_id` int NOT NULL,
  `section_name` varchar(20) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`section_id`),
  KEY `idx_sections_classroom_id` (`classroom_id`),
  KEY `sections_client_master_FK` (`client_id`),
  CONSTRAINT `fk_sections_classroom` FOREIGN KEY (`classroom_id`) REFERENCES `classrooms` (`classroom_id`) ON DELETE CASCADE,
  CONSTRAINT `sections_client_master_FK` FOREIGN KEY (`client_id`) REFERENCES `client_master` (`client_id`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sections`
--

LOCK TABLES `sections` WRITE;
/*!40000 ALTER TABLE `sections` DISABLE KEYS */;
INSERT INTO `sections` VALUES (7,23,9,'A','2026-05-30 16:47:48','2026-05-30 16:47:48'),(8,23,9,'B','2026-05-30 16:47:48','2026-05-30 16:47:48'),(9,23,9,'C','2026-05-30 16:47:48','2026-05-30 16:47:48'),(10,23,10,'A','2026-05-30 16:47:55','2026-05-30 16:47:55'),(11,23,10,'B','2026-05-30 16:47:55','2026-05-30 16:47:55');
/*!40000 ALTER TABLE `sections` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `session_periods`
--

DROP TABLE IF EXISTS `session_periods`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `session_periods` (
  `period_id` int NOT NULL AUTO_INCREMENT,
  `session_id` int NOT NULL,
  `period_number` int NOT NULL,
  `label` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `duration_minutes` int NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`period_id`),
  UNIQUE KEY `uq_session_periods` (`session_id`,`period_number`),
  CONSTRAINT `fk_session_periods_session` FOREIGN KEY (`session_id`) REFERENCES `school_sessions` (`session_id`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `session_periods`
--

LOCK TABLES `session_periods` WRITE;
/*!40000 ALTER TABLE `session_periods` DISABLE KEYS */;
INSERT INTO `session_periods` VALUES (12,3,1,'Period 1','09:00:00','09:45:00',45,1,'2026-05-31 01:47:04','2026-05-31 01:47:04'),(13,3,2,'Period 2','09:45:00','10:30:00',45,1,'2026-05-31 01:47:04','2026-05-31 01:47:04'),(14,3,3,'Period 3','10:45:00','11:30:00',45,1,'2026-05-31 01:47:04','2026-05-31 01:47:04'),(15,3,4,'Period 4','11:30:00','12:15:00',45,1,'2026-05-31 01:47:04','2026-05-31 01:47:04'),(16,3,5,'Period 5','13:00:00','13:45:00',45,1,'2026-05-31 01:47:04','2026-05-31 01:47:04'),(17,3,6,'Period 6','13:45:00','14:30:00',45,1,'2026-05-31 01:47:04','2026-05-31 01:47:04'),(18,3,7,'Period 7','14:45:00','15:30:00',45,1,'2026-05-31 01:47:04','2026-05-31 01:47:04'),(19,3,8,'Period 8','15:30:00','16:15:00',45,1,'2026-05-31 01:47:04','2026-05-31 01:47:04');
/*!40000 ALTER TABLE `session_periods` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `staff`
--

DROP TABLE IF EXISTS `staff`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `staff` (
  `staff_id` int NOT NULL AUTO_INCREMENT,
  `client_id` bigint DEFAULT NULL,
  `employee_id` varchar(20) NOT NULL,
  `firstName` varchar(50) NOT NULL,
  `lastName` varchar(50) NOT NULL,
  `role` enum('DRIVER','CONDUCTOR','SUPERVISOR','ADMINISTRATOR') NOT NULL,
  `contactNumber` varchar(20) NOT NULL,
  `email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `address` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `joiningDate` date NOT NULL,
  `status` enum('ACTIVATE','INACTIVE') DEFAULT 'ACTIVATE',
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`staff_id`),
  UNIQUE KEY `employee_id` (`employee_id`),
  UNIQUE KEY `email` (`email`),
  KEY `staff_FK` (`client_id`),
  CONSTRAINT `staff_client_master_FK` FOREIGN KEY (`client_id`) REFERENCES `client_master` (`client_id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `staff`
--

LOCK TABLES `staff` WRITE;
/*!40000 ALTER TABLE `staff` DISABLE KEYS */;
INSERT INTO `staff` VALUES (15,23,'STF001','CHANDRA','SHAKER','DRIVER','1234567890',NULL,NULL,'2026-05-01','ACTIVATE','2026-05-31 05:47:54','2026-05-31 05:47:54');
/*!40000 ALTER TABLE `staff` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `student_attendance`
--

DROP TABLE IF EXISTS `student_attendance`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_attendance` (
  `student_attendance_id` int NOT NULL AUTO_INCREMENT,
  `schedule_id` int NOT NULL,
  `student_id` int NOT NULL,
  `attendance_date` date NOT NULL,
  `attendance_session` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Period',
  `status` enum('Present','Late','Absent','Excused') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `check_in` time DEFAULT NULL,
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `marked_by` int DEFAULT NULL,
  `marked_by_teacher_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`student_attendance_id`),
  UNIQUE KEY `uq_student_attendance_session` (`schedule_id`,`student_id`,`attendance_date`,`attendance_session`),
  KEY `fk_student_attendance_student` (`student_id`),
  CONSTRAINT `fk_student_attendance_schedule` FOREIGN KEY (`schedule_id`) REFERENCES `class_schedule` (`schedule_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_student_attendance_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=201 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student_attendance`
--

LOCK TABLES `student_attendance` WRITE;
/*!40000 ALTER TABLE `student_attendance` DISABLE KEYS */;
INSERT INTO `student_attendance` VALUES (1,5,101,'2026-06-01','Session','Present',NULL,NULL,48,NULL,'2026-05-31 18:01:04','2026-06-01 02:28:35'),(2,5,103,'2026-06-01','Session','Present',NULL,NULL,48,NULL,'2026-05-31 18:01:04','2026-06-01 02:28:35'),(3,5,136,'2026-06-01','Session','Present',NULL,NULL,48,NULL,'2026-05-31 18:01:04','2026-06-01 02:28:35'),(4,5,132,'2026-06-01','Session','Present',NULL,NULL,48,NULL,'2026-05-31 18:01:04','2026-06-01 02:28:35'),(5,5,123,'2026-06-01','Session','Present',NULL,NULL,48,NULL,'2026-05-31 18:01:04','2026-06-01 02:28:35'),(6,5,122,'2026-06-01','Session','Present',NULL,NULL,48,NULL,'2026-05-31 18:01:04','2026-06-01 02:28:35'),(7,5,130,'2026-06-01','Session','Present',NULL,NULL,48,NULL,'2026-05-31 18:01:04','2026-06-01 02:28:35'),(8,5,147,'2026-06-01','Session','Present',NULL,NULL,48,NULL,'2026-05-31 18:01:04','2026-06-01 02:28:35'),(9,5,131,'2026-06-01','Session','Present',NULL,NULL,48,NULL,'2026-05-31 18:01:04','2026-06-01 02:28:35'),(10,5,127,'2026-06-01','Session','Present',NULL,NULL,48,NULL,'2026-05-31 18:01:04','2026-06-01 02:28:35'),(11,5,119,'2026-06-01','Session','Present',NULL,NULL,48,NULL,'2026-05-31 18:01:04','2026-06-01 02:28:35'),(12,5,115,'2026-06-01','Session','Present',NULL,NULL,48,NULL,'2026-05-31 18:01:04','2026-06-01 02:28:35'),(13,5,106,'2026-06-01','Session','Present',NULL,NULL,48,NULL,'2026-05-31 18:01:04','2026-06-01 02:28:35'),(14,5,126,'2026-06-01','Session','Present',NULL,NULL,48,NULL,'2026-05-31 18:01:04','2026-06-01 02:28:35'),(15,5,145,'2026-06-01','Session','Present',NULL,NULL,48,NULL,'2026-05-31 18:01:04','2026-06-01 02:28:35'),(16,5,111,'2026-06-01','Session','Present',NULL,NULL,48,NULL,'2026-05-31 18:01:04','2026-06-01 02:28:35'),(17,5,142,'2026-06-01','Session','Present',NULL,NULL,48,NULL,'2026-05-31 18:01:04','2026-06-01 02:28:35'),(18,5,134,'2026-06-01','Session','Present',NULL,NULL,48,NULL,'2026-05-31 18:01:04','2026-06-01 02:28:35'),(19,5,118,'2026-06-01','Session','Present',NULL,NULL,48,NULL,'2026-05-31 18:01:04','2026-06-01 02:28:35'),(20,5,113,'2026-06-01','Session','Present',NULL,NULL,48,NULL,'2026-05-31 18:01:04','2026-06-01 02:28:35'),(21,5,42,'2026-06-01','Session','Present',NULL,NULL,48,NULL,'2026-05-31 18:01:04','2026-06-01 02:28:35'),(22,5,105,'2026-06-01','Session','Present',NULL,NULL,48,NULL,'2026-05-31 18:01:04','2026-06-01 02:28:35'),(23,5,112,'2026-06-01','Session','Present',NULL,NULL,48,NULL,'2026-05-31 18:01:04','2026-06-01 02:28:35'),(24,5,125,'2026-06-01','Session','Present',NULL,NULL,48,NULL,'2026-05-31 18:01:04','2026-06-01 02:28:35'),(25,5,128,'2026-06-01','Session','Present',NULL,NULL,48,NULL,'2026-05-31 18:01:04','2026-06-01 02:28:35'),(26,5,47,'2026-06-01','Session','Present',NULL,NULL,48,NULL,'2026-05-31 18:01:04','2026-06-01 02:28:35'),(27,5,129,'2026-06-01','Session','Present',NULL,NULL,48,NULL,'2026-05-31 18:01:04','2026-06-01 02:28:35'),(28,5,102,'2026-06-01','Session','Present',NULL,NULL,48,NULL,'2026-05-31 18:01:04','2026-06-01 02:28:35'),(29,5,137,'2026-06-01','Session','Present',NULL,NULL,48,NULL,'2026-05-31 18:01:04','2026-06-01 02:28:35'),(30,5,114,'2026-06-01','Session','Present',NULL,NULL,48,NULL,'2026-05-31 18:01:04','2026-06-01 02:28:35'),(31,5,109,'2026-06-01','Session','Present',NULL,NULL,48,NULL,'2026-05-31 18:01:04','2026-06-01 02:28:35'),(32,5,124,'2026-06-01','Session','Present',NULL,NULL,48,NULL,'2026-05-31 18:01:04','2026-06-01 02:28:35'),(33,5,135,'2026-06-01','Session','Present',NULL,NULL,48,NULL,'2026-05-31 18:01:04','2026-06-01 02:28:35'),(34,5,146,'2026-06-01','Session','Present',NULL,NULL,48,NULL,'2026-05-31 18:01:04','2026-06-01 02:28:35'),(35,5,104,'2026-06-01','Session','Present',NULL,NULL,48,NULL,'2026-05-31 18:01:04','2026-06-01 02:28:35'),(36,5,117,'2026-06-01','Session','Present',NULL,NULL,48,NULL,'2026-05-31 18:01:04','2026-06-01 02:28:35'),(37,5,108,'2026-06-01','Session','Present',NULL,NULL,48,NULL,'2026-05-31 18:01:04','2026-06-01 02:28:35'),(38,5,148,'2026-06-01','Session','Present',NULL,NULL,48,NULL,'2026-05-31 18:01:04','2026-06-01 02:28:35'),(39,5,140,'2026-06-01','Session','Present',NULL,NULL,48,NULL,'2026-05-31 18:01:04','2026-06-01 02:28:35'),(40,5,141,'2026-06-01','Session','Present',NULL,NULL,48,NULL,'2026-05-31 18:01:04','2026-06-01 02:28:35'),(41,5,116,'2026-06-01','Session','Present',NULL,NULL,48,NULL,'2026-05-31 18:01:04','2026-06-01 02:28:35'),(42,5,139,'2026-06-01','Session','Present',NULL,NULL,48,NULL,'2026-05-31 18:01:04','2026-06-01 02:28:35'),(43,5,144,'2026-06-01','Session','Present',NULL,NULL,48,NULL,'2026-05-31 18:01:04','2026-06-01 02:28:35'),(44,5,121,'2026-06-01','Session','Present',NULL,NULL,48,NULL,'2026-05-31 18:01:04','2026-06-01 02:28:35'),(45,5,120,'2026-06-01','Session','Present',NULL,NULL,48,NULL,'2026-05-31 18:01:04','2026-06-01 02:28:35'),(46,5,100,'2026-06-01','Session','Present',NULL,NULL,48,NULL,'2026-05-31 18:01:04','2026-06-01 02:28:35'),(47,5,143,'2026-06-01','Session','Present',NULL,NULL,48,NULL,'2026-05-31 18:01:04','2026-06-01 02:28:35'),(48,5,110,'2026-06-01','Session','Present',NULL,NULL,48,NULL,'2026-05-31 18:01:04','2026-06-01 02:28:35'),(49,5,138,'2026-06-01','Session','Present',NULL,NULL,48,NULL,'2026-05-31 18:01:04','2026-06-01 02:28:35'),(50,5,133,'2026-06-01','Session','Present',NULL,NULL,48,NULL,'2026-05-31 18:01:04','2026-06-01 02:28:35'),(51,5,107,'2026-06-01','Session','Present',NULL,NULL,48,NULL,'2026-05-31 18:01:04','2026-06-01 02:28:35'),(103,12,94,'2026-06-01','Session','Present',NULL,NULL,48,NULL,'2026-06-01 02:29:10','2026-06-01 02:29:10'),(104,12,66,'2026-06-01','Session','Present',NULL,NULL,48,NULL,'2026-06-01 02:29:10','2026-06-01 02:29:10'),(105,12,61,'2026-06-01','Session','Present',NULL,NULL,48,NULL,'2026-06-01 02:29:10','2026-06-01 02:29:10'),(106,12,90,'2026-06-01','Session','Present',NULL,NULL,48,NULL,'2026-06-01 02:29:10','2026-06-01 02:29:10'),(107,12,89,'2026-06-01','Session','Present',NULL,NULL,48,NULL,'2026-06-01 02:29:10','2026-06-01 02:29:10'),(108,12,70,'2026-06-01','Session','Present',NULL,NULL,48,NULL,'2026-06-01 02:29:10','2026-06-01 02:29:10'),(109,12,56,'2026-06-01','Session','Present',NULL,NULL,48,NULL,'2026-06-01 02:29:10','2026-06-01 02:29:10'),(110,12,57,'2026-06-01','Session','Present',NULL,NULL,48,NULL,'2026-06-01 02:29:10','2026-06-01 02:29:10'),(111,12,58,'2026-06-01','Session','Present',NULL,NULL,48,NULL,'2026-06-01 02:29:10','2026-06-01 02:29:10'),(112,12,52,'2026-06-01','Session','Present',NULL,NULL,48,NULL,'2026-06-01 02:29:10','2026-06-01 02:29:10'),(113,12,98,'2026-06-01','Session','Present',NULL,NULL,48,NULL,'2026-06-01 02:29:10','2026-06-01 02:29:10'),(114,12,63,'2026-06-01','Session','Present',NULL,NULL,48,NULL,'2026-06-01 02:29:10','2026-06-01 02:29:10'),(115,12,72,'2026-06-01','Session','Present',NULL,NULL,48,NULL,'2026-06-01 02:29:10','2026-06-01 02:29:10'),(116,12,81,'2026-06-01','Session','Present',NULL,NULL,48,NULL,'2026-06-01 02:29:10','2026-06-01 02:29:10'),(117,12,93,'2026-06-01','Session','Present',NULL,NULL,48,NULL,'2026-06-01 02:29:10','2026-06-01 02:29:10'),(118,12,79,'2026-06-01','Session','Present',NULL,NULL,48,NULL,'2026-06-01 02:29:10','2026-06-01 02:29:10'),(119,12,71,'2026-06-01','Session','Present',NULL,NULL,48,NULL,'2026-06-01 02:29:10','2026-06-01 02:29:10'),(120,12,92,'2026-06-01','Session','Present',NULL,NULL,48,NULL,'2026-06-01 02:29:10','2026-06-01 02:29:10'),(121,12,97,'2026-06-01','Session','Present',NULL,NULL,48,NULL,'2026-06-01 02:29:10','2026-06-01 02:29:10'),(122,12,78,'2026-06-01','Session','Present',NULL,NULL,48,NULL,'2026-06-01 02:29:10','2026-06-01 02:29:10'),(123,12,45,'2026-06-01','Session','Present',NULL,NULL,48,NULL,'2026-06-01 02:29:10','2026-06-01 02:29:10'),(124,12,75,'2026-06-01','Session','Present',NULL,NULL,48,NULL,'2026-06-01 02:29:10','2026-06-01 02:29:10'),(125,12,76,'2026-06-01','Session','Present',NULL,NULL,48,NULL,'2026-06-01 02:29:10','2026-06-01 02:29:10'),(126,12,99,'2026-06-01','Session','Present',NULL,NULL,48,NULL,'2026-06-01 02:29:10','2026-06-01 02:29:10'),(127,12,48,'2026-06-01','Session','Present',NULL,NULL,48,NULL,'2026-06-01 02:29:10','2026-06-01 02:29:10'),(128,12,82,'2026-06-01','Session','Present',NULL,NULL,48,NULL,'2026-06-01 02:29:10','2026-06-01 02:29:10'),(129,12,54,'2026-06-01','Session','Present',NULL,NULL,48,NULL,'2026-06-01 02:29:10','2026-06-01 02:29:10'),(130,12,67,'2026-06-01','Session','Present',NULL,NULL,48,NULL,'2026-06-01 02:29:10','2026-06-01 02:29:10'),(131,12,87,'2026-06-01','Session','Present',NULL,NULL,48,NULL,'2026-06-01 02:29:10','2026-06-01 02:29:10'),(132,12,68,'2026-06-01','Session','Present',NULL,NULL,48,NULL,'2026-06-01 02:29:10','2026-06-01 02:29:10'),(133,12,69,'2026-06-01','Session','Present',NULL,NULL,48,NULL,'2026-06-01 02:29:10','2026-06-01 02:29:10'),(134,12,84,'2026-06-01','Session','Present',NULL,NULL,48,NULL,'2026-06-01 02:29:10','2026-06-01 02:29:10'),(135,12,62,'2026-06-01','Session','Present',NULL,NULL,48,NULL,'2026-06-01 02:29:10','2026-06-01 02:29:10'),(136,12,50,'2026-06-01','Session','Present',NULL,NULL,48,NULL,'2026-06-01 02:29:10','2026-06-01 02:29:10'),(137,12,80,'2026-06-01','Session','Present',NULL,NULL,48,NULL,'2026-06-01 02:29:10','2026-06-01 02:29:10'),(138,12,96,'2026-06-01','Session','Present',NULL,NULL,48,NULL,'2026-06-01 02:29:10','2026-06-01 02:29:10'),(139,12,65,'2026-06-01','Session','Present',NULL,NULL,48,NULL,'2026-06-01 02:29:10','2026-06-01 02:29:10'),(140,12,95,'2026-06-01','Session','Present',NULL,NULL,48,NULL,'2026-06-01 02:29:10','2026-06-01 02:29:10'),(141,12,53,'2026-06-01','Session','Present',NULL,NULL,48,NULL,'2026-06-01 02:29:10','2026-06-01 02:29:10'),(142,12,49,'2026-06-01','Session','Present',NULL,NULL,48,NULL,'2026-06-01 02:29:10','2026-06-01 02:29:10'),(143,12,73,'2026-06-01','Session','Present',NULL,NULL,48,NULL,'2026-06-01 02:29:10','2026-06-01 02:29:10'),(144,12,77,'2026-06-01','Session','Present',NULL,NULL,48,NULL,'2026-06-01 02:29:10','2026-06-01 02:29:10'),(145,12,91,'2026-06-01','Session','Present',NULL,NULL,48,NULL,'2026-06-01 02:29:10','2026-06-01 02:29:10'),(146,12,88,'2026-06-01','Session','Present',NULL,NULL,48,NULL,'2026-06-01 02:29:10','2026-06-01 02:29:10'),(147,12,83,'2026-06-01','Session','Present',NULL,NULL,48,NULL,'2026-06-01 02:29:10','2026-06-01 02:29:10'),(148,12,64,'2026-06-01','Session','Present',NULL,NULL,48,NULL,'2026-06-01 02:29:10','2026-06-01 02:29:10'),(149,12,55,'2026-06-01','Session','Present',NULL,NULL,48,NULL,'2026-06-01 02:29:10','2026-06-01 02:29:10'),(150,12,74,'2026-06-01','Session','Present',NULL,NULL,48,NULL,'2026-06-01 02:29:10','2026-06-01 02:29:10'),(151,12,51,'2026-06-01','Session','Present',NULL,NULL,48,NULL,'2026-06-01 02:29:10','2026-06-01 02:29:10'),(152,31,94,'2026-05-29','Afternoon','Present',NULL,NULL,58,9,'2026-06-01 05:12:26','2026-06-01 05:12:26'),(153,31,66,'2026-05-29','Afternoon','Present',NULL,NULL,58,9,'2026-06-01 05:12:26','2026-06-01 05:12:26'),(154,31,61,'2026-05-29','Afternoon','Present',NULL,NULL,58,9,'2026-06-01 05:12:26','2026-06-01 05:12:26'),(155,31,90,'2026-05-29','Afternoon','Present',NULL,NULL,58,9,'2026-06-01 05:12:26','2026-06-01 05:12:26'),(156,31,89,'2026-05-29','Afternoon','Present',NULL,NULL,58,9,'2026-06-01 05:12:26','2026-06-01 05:12:26'),(157,31,70,'2026-05-29','Afternoon','Present',NULL,NULL,58,9,'2026-06-01 05:12:26','2026-06-01 05:12:26'),(158,31,56,'2026-05-29','Afternoon','Present',NULL,NULL,58,9,'2026-06-01 05:12:26','2026-06-01 05:12:26'),(159,31,57,'2026-05-29','Afternoon','Present',NULL,NULL,58,9,'2026-06-01 05:12:26','2026-06-01 05:12:26'),(160,31,58,'2026-05-29','Afternoon','Present',NULL,NULL,58,9,'2026-06-01 05:12:26','2026-06-01 05:12:26'),(161,31,52,'2026-05-29','Afternoon','Present',NULL,NULL,58,9,'2026-06-01 05:12:26','2026-06-01 05:12:26'),(162,31,98,'2026-05-29','Afternoon','Present',NULL,NULL,58,9,'2026-06-01 05:12:26','2026-06-01 05:12:26'),(163,31,63,'2026-05-29','Afternoon','Present',NULL,NULL,58,9,'2026-06-01 05:12:26','2026-06-01 05:12:26'),(164,31,72,'2026-05-29','Afternoon','Present',NULL,NULL,58,9,'2026-06-01 05:12:26','2026-06-01 05:12:26'),(165,31,81,'2026-05-29','Afternoon','Present',NULL,NULL,58,9,'2026-06-01 05:12:26','2026-06-01 05:12:26'),(166,31,93,'2026-05-29','Afternoon','Present',NULL,NULL,58,9,'2026-06-01 05:12:26','2026-06-01 05:12:26'),(167,31,79,'2026-05-29','Afternoon','Present',NULL,NULL,58,9,'2026-06-01 05:12:26','2026-06-01 05:12:26'),(168,31,71,'2026-05-29','Afternoon','Present',NULL,NULL,58,9,'2026-06-01 05:12:26','2026-06-01 05:12:26'),(169,31,92,'2026-05-29','Afternoon','Present',NULL,NULL,58,9,'2026-06-01 05:12:26','2026-06-01 05:12:26'),(170,31,97,'2026-05-29','Afternoon','Present',NULL,NULL,58,9,'2026-06-01 05:12:26','2026-06-01 05:12:26'),(171,31,78,'2026-05-29','Afternoon','Present',NULL,NULL,58,9,'2026-06-01 05:12:26','2026-06-01 05:12:26'),(172,31,45,'2026-05-29','Afternoon','Present',NULL,NULL,58,9,'2026-06-01 05:12:26','2026-06-01 05:12:26'),(173,31,75,'2026-05-29','Afternoon','Present',NULL,NULL,58,9,'2026-06-01 05:12:26','2026-06-01 05:12:26'),(174,31,76,'2026-05-29','Afternoon','Present',NULL,NULL,58,9,'2026-06-01 05:12:26','2026-06-01 05:12:26'),(175,31,99,'2026-05-29','Afternoon','Present',NULL,NULL,58,9,'2026-06-01 05:12:26','2026-06-01 05:12:26'),(176,31,48,'2026-05-29','Afternoon','Present',NULL,NULL,58,9,'2026-06-01 05:12:26','2026-06-01 05:12:26'),(177,31,82,'2026-05-29','Afternoon','Present',NULL,NULL,58,9,'2026-06-01 05:12:26','2026-06-01 05:12:26'),(178,31,54,'2026-05-29','Afternoon','Present',NULL,NULL,58,9,'2026-06-01 05:12:26','2026-06-01 05:12:26'),(179,31,67,'2026-05-29','Afternoon','Present',NULL,NULL,58,9,'2026-06-01 05:12:26','2026-06-01 05:12:26'),(180,31,87,'2026-05-29','Afternoon','Present',NULL,NULL,58,9,'2026-06-01 05:12:26','2026-06-01 05:12:26'),(181,31,68,'2026-05-29','Afternoon','Present',NULL,NULL,58,9,'2026-06-01 05:12:26','2026-06-01 05:12:26'),(182,31,69,'2026-05-29','Afternoon','Present',NULL,NULL,58,9,'2026-06-01 05:12:26','2026-06-01 05:12:26'),(183,31,84,'2026-05-29','Afternoon','Present',NULL,NULL,58,9,'2026-06-01 05:12:26','2026-06-01 05:12:26'),(184,31,62,'2026-05-29','Afternoon','Present',NULL,NULL,58,9,'2026-06-01 05:12:26','2026-06-01 05:12:26'),(185,31,50,'2026-05-29','Afternoon','Present',NULL,NULL,58,9,'2026-06-01 05:12:26','2026-06-01 05:12:26'),(186,31,80,'2026-05-29','Afternoon','Present',NULL,NULL,58,9,'2026-06-01 05:12:26','2026-06-01 05:12:26'),(187,31,96,'2026-05-29','Afternoon','Present',NULL,NULL,58,9,'2026-06-01 05:12:26','2026-06-01 05:12:26'),(188,31,65,'2026-05-29','Afternoon','Present',NULL,NULL,58,9,'2026-06-01 05:12:26','2026-06-01 05:12:26'),(189,31,95,'2026-05-29','Afternoon','Present',NULL,NULL,58,9,'2026-06-01 05:12:26','2026-06-01 05:12:26'),(190,31,53,'2026-05-29','Afternoon','Present',NULL,NULL,58,9,'2026-06-01 05:12:26','2026-06-01 05:12:26'),(191,31,49,'2026-05-29','Afternoon','Present',NULL,NULL,58,9,'2026-06-01 05:12:26','2026-06-01 05:12:26'),(192,31,73,'2026-05-29','Afternoon','Present',NULL,NULL,58,9,'2026-06-01 05:12:26','2026-06-01 05:12:26'),(193,31,77,'2026-05-29','Afternoon','Present',NULL,NULL,58,9,'2026-06-01 05:12:26','2026-06-01 05:12:26'),(194,31,91,'2026-05-29','Afternoon','Present',NULL,NULL,58,9,'2026-06-01 05:12:26','2026-06-01 05:12:26'),(195,31,88,'2026-05-29','Afternoon','Present',NULL,NULL,58,9,'2026-06-01 05:12:26','2026-06-01 05:12:26'),(196,31,83,'2026-05-29','Afternoon','Present',NULL,NULL,58,9,'2026-06-01 05:12:26','2026-06-01 05:12:26'),(197,31,64,'2026-05-29','Afternoon','Present',NULL,NULL,58,9,'2026-06-01 05:12:26','2026-06-01 05:12:26'),(198,31,55,'2026-05-29','Afternoon','Present',NULL,NULL,58,9,'2026-06-01 05:12:26','2026-06-01 05:12:26'),(199,31,74,'2026-05-29','Afternoon','Present',NULL,NULL,58,9,'2026-06-01 05:12:26','2026-06-01 05:12:26'),(200,31,51,'2026-05-29','Afternoon','Present',NULL,NULL,58,9,'2026-06-01 05:12:26','2026-06-01 05:12:26');
/*!40000 ALTER TABLE `student_attendance` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `student_room_assignments`
--

DROP TABLE IF EXISTS `student_room_assignments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_room_assignments` (
  `assignment_id` int NOT NULL AUTO_INCREMENT,
  `client_id` bigint DEFAULT NULL,
  `student_id` int NOT NULL,
  `room_id` int NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date DEFAULT NULL,
  PRIMARY KEY (`assignment_id`),
  KEY `student_id` (`student_id`),
  KEY `room_id` (`room_id`),
  KEY `student_room_assignments_FK` (`client_id`),
  CONSTRAINT `student_room_assignments_client_master_FK` FOREIGN KEY (`client_id`) REFERENCES `client_master` (`client_id`),
  CONSTRAINT `student_room_assignments_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`) ON DELETE CASCADE,
  CONSTRAINT `student_room_assignments_ibfk_2` FOREIGN KEY (`room_id`) REFERENCES `hostel_rooms` (`room_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student_room_assignments`
--

LOCK TABLES `student_room_assignments` WRITE;
/*!40000 ALTER TABLE `student_room_assignments` DISABLE KEYS */;
/*!40000 ALTER TABLE `student_room_assignments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `students`
--

DROP TABLE IF EXISTS `students`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `students` (
  `student_id` int NOT NULL AUTO_INCREMENT,
  `client_id` bigint DEFAULT NULL,
  `yearly_fee` varchar(100) DEFAULT NULL,
  `admission_number` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `first_name` varchar(50) NOT NULL,
  `middle_name` varchar(50) DEFAULT NULL,
  `last_name` varchar(50) NOT NULL,
  `class_name` int DEFAULT NULL,
  `date_of_birth` date NOT NULL,
  `gender` enum('Male','Female','Other') NOT NULL,
  `blood_group` varchar(5) DEFAULT NULL,
  `nationality` varchar(50) DEFAULT NULL,
  `religion` varchar(50) DEFAULT NULL,
  `transport_id` int DEFAULT NULL,
  `pickupPoint` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `address_line1` varchar(100) DEFAULT NULL,
  `address_line2` varchar(100) DEFAULT NULL,
  `city` varchar(50) DEFAULT NULL,
  `state` varchar(50) DEFAULT NULL,
  `postal_code` varchar(10) DEFAULT NULL,
  `country` varchar(50) DEFAULT NULL,
  `phone_number` varchar(15) DEFAULT NULL,
  `alternate_phone` varchar(15) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `emergency_contact_name` varchar(100) DEFAULT NULL,
  `emergency_contact_relation` varchar(50) DEFAULT NULL,
  `emergency_contact_number` varchar(15) DEFAULT NULL,
  `admission_date` date NOT NULL,
  `enrollment_status` enum('Active','Inactive','Alumni') NOT NULL,
  `grade_level` varchar(20) DEFAULT NULL,
  `section` varchar(5) DEFAULT NULL,
  `roll_number` int DEFAULT NULL,
  `academic_year` varchar(20) DEFAULT NULL,
  `father_name` varchar(100) DEFAULT NULL,
  `father_occupation` varchar(50) DEFAULT NULL,
  `father_contact` varchar(15) DEFAULT NULL,
  `mother_name` varchar(100) DEFAULT NULL,
  `mother_occupation` varchar(50) DEFAULT NULL,
  `mother_contact` varchar(15) DEFAULT NULL,
  `guardian_name` varchar(100) DEFAULT NULL,
  `guardian_relation` varchar(50) DEFAULT NULL,
  `guardian_contact` varchar(15) DEFAULT NULL,
  `current_grade` varchar(20) DEFAULT NULL,
  `previous_school` varchar(100) DEFAULT NULL,
  `marks_obtained` varchar(50) DEFAULT NULL,
  `allergies` text,
  `medical_conditions` text,
  `vaccination_status` varchar(100) DEFAULT NULL,
  `total_days_present` int DEFAULT '0',
  `total_days_absent` int DEFAULT '0',
  `club_membership` text,
  `sports_participation` text,
  `achievements` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` int DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  PRIMARY KEY (`student_id`),
  UNIQUE KEY `admission_number` (`admission_number`),
  KEY `students_client_master_FK` (`client_id`),
  KEY `students_classrooms_FK` (`class_name`),
  KEY `students_FK` (`transport_id`),
  CONSTRAINT `students_classrooms_FK` FOREIGN KEY (`class_name`) REFERENCES `classrooms` (`classroom_id`),
  CONSTRAINT `students_client_master_FK` FOREIGN KEY (`client_id`) REFERENCES `client_master` (`client_id`),
  CONSTRAINT `students_FK` FOREIGN KEY (`transport_id`) REFERENCES `transports` (`transport_id`)
) ENGINE=InnoDB AUTO_INCREMENT=150 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `students`
--

LOCK TABLES `students` WRITE;
/*!40000 ALTER TABLE `students` DISABLE KEYS */;
INSERT INTO `students` VALUES (42,23,'15000','202627-10STCLASS-A-001','HARSHAVARDHAN','REDDY','MUNGALA',10,'2006-01-01','Male','O+','INDIAN','HINDU',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'9090909090',NULL,'harshavardhan.mungala@gmail.com','KASIRATNA REDDY',NULL,'9848624532','2026-05-31','Active','10 st Class','A',1,'2026-27',NULL,NULL,'9848624532','ADI LAKSHMI',NULL,'9390012345','KASIRATNA REDDY','FATHER','9848624532','10 st Class',NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-05-31 00:50:48','2026-05-31 00:50:48',NULL,NULL),(45,23,'15000','ADM2026001','James',NULL,'Smith',9,'2011-01-01','Male',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'9100000000',NULL,NULL,NULL,NULL,NULL,'2026-06-01','Active','Class 9','A',1,'2026-27','Father_James',NULL,'981000000','Mother_James',NULL,'971000000',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-05-31 10:08:11','2026-05-31 10:08:11',NULL,NULL),(47,23,'15000','ADM2026100','Johnny',NULL,'Smith',10,'2011-04-16','Female',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'9100000099',NULL,NULL,NULL,NULL,NULL,'2026-06-01','Active','Class 10','A',100,'2026-27','Father_Johnny',NULL,'981000099','Mother_Johnny',NULL,'971000099',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-05-31 10:10:22','2026-05-31 10:10:22',NULL,NULL),(48,23,'15000','ADM2026002','John',NULL,'Smith',9,'2011-02-02','Female',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'9100000001',NULL,NULL,NULL,NULL,NULL,'2026-06-01','Active','Class 9','A',2,'2026-27','Father_John',NULL,'981000001','Mother_John',NULL,'971000001',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-05-31 10:10:37','2026-05-31 10:10:37',NULL,NULL),(49,23,'15000','ADM2026003','Robert',NULL,'Smith',9,'2011-03-03','Male',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'9100000002',NULL,NULL,NULL,NULL,NULL,'2026-06-01','Active','Class 9','A',3,'2026-27','Father_Robert',NULL,'981000002','Mother_Robert',NULL,'971000002',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-05-31 10:10:41','2026-05-31 10:10:41',NULL,NULL),(50,23,'15000','ADM2026004','Michael',NULL,'Smith',9,'2011-04-04','Female',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'9100000003',NULL,NULL,NULL,NULL,NULL,'2026-06-01','Active','Class 9','A',4,'2026-27','Father_Michael',NULL,'981000003','Mother_Michael',NULL,'971000003',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-05-31 10:10:48','2026-05-31 10:10:48',NULL,NULL),(51,23,'15000','ADM2026005','William',NULL,'Smith',9,'2011-05-05','Male',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'9100000004',NULL,NULL,NULL,NULL,NULL,'2026-06-01','Active','Class 9','A',5,'2026-27','Father_William',NULL,'981000004','Mother_William',NULL,'971000004',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-05-31 10:10:54','2026-05-31 10:10:54',NULL,NULL),(52,23,'15000','ADM2026006','David',NULL,'Smith',9,'2011-06-06','Female',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'9100000005',NULL,NULL,NULL,NULL,NULL,'2026-06-01','Active','Class 9','A',6,'2026-27','Father_David',NULL,'981000005','Mother_David',NULL,'971000005',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-05-31 10:10:57','2026-05-31 10:10:57',NULL,NULL),(53,23,'15000','ADM2026007','Richard',NULL,'Smith',9,'2011-07-07','Male',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'9100000006',NULL,NULL,NULL,NULL,NULL,'2026-06-01','Active','Class 9','A',7,'2026-27','Father_Richard',NULL,'981000006','Mother_Richard',NULL,'971000006',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-05-31 10:11:03','2026-05-31 10:11:03',NULL,NULL),(54,23,'15000','ADM2026008','Joseph',NULL,'Smith',9,'2011-08-08','Female',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'9100000007',NULL,NULL,NULL,NULL,NULL,'2026-06-01','Active','Class 9','A',8,'2026-27','Father_Joseph',NULL,'981000007','Mother_Joseph',NULL,'971000007',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-05-31 10:11:06','2026-05-31 10:11:06',NULL,NULL),(55,23,'15000','ADM2026009','Thomas',NULL,'Smith',9,'2011-09-09','Male',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'9100000008',NULL,NULL,NULL,NULL,NULL,'2026-06-01','Active','Class 9','A',9,'2026-27','Father_Thomas',NULL,'981000008','Mother_Thomas',NULL,'971000008',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-05-31 10:11:11','2026-05-31 10:11:11',NULL,NULL),(56,23,'15000','ADM2026010','Charles',NULL,'Smith',9,'2011-10-10','Female',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'9100000009',NULL,NULL,NULL,NULL,NULL,'2026-06-01','Active','Class 9','A',10,'2026-27','Father_Charles',NULL,'981000009','Mother_Charles',NULL,'971000009',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-05-31 10:11:18','2026-05-31 10:11:18',NULL,NULL),(57,23,'15000','ADM2026011','Christopher',NULL,'Smith',9,'2011-11-11','Male',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'9100000010',NULL,NULL,NULL,NULL,NULL,'2026-06-01','Active','Class 9','A',11,'2026-27','Father_Christopher',NULL,'981000010','Mother_Christopher',NULL,'971000010',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-05-31 10:11:24','2026-05-31 10:11:24',NULL,NULL),(58,23,'15000','ADM2026012','Daniel',NULL,'Smith',9,'2011-12-12','Female',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'9100000011',NULL,NULL,NULL,NULL,NULL,'2026-06-01','Active','Class 9','A',12,'2026-27','Father_Daniel',NULL,'981000011','Mother_Daniel',NULL,'971000011',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-05-31 10:11:44','2026-05-31 10:11:44',NULL,NULL),(61,23,'15000','ADM2026014','Anthony',NULL,'Smith',9,'2011-02-14','Female',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'9100000013',NULL,NULL,NULL,NULL,NULL,'2026-06-01','Active','Class 9','A',14,'2026-27','Father_Anthony',NULL,'981000013','Mother_Anthony',NULL,'971000013',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-05-31 10:12:48','2026-05-31 10:12:48',NULL,NULL),(62,23,'15000','ADM2026015','Mark',NULL,'Smith',9,'2011-03-15','Male',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'9100000014',NULL,NULL,NULL,NULL,NULL,'2026-06-01','Active','Class 9','A',15,'2026-27','Father_Mark',NULL,'981000014','Mother_Mark',NULL,'971000014',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-05-31 10:12:48','2026-05-31 10:12:48',NULL,NULL),(63,23,'15000','ADM2026016','Donald',NULL,'Smith',9,'2011-04-16','Female',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'9100000015',NULL,NULL,NULL,NULL,NULL,'2026-06-01','Active','Class 9','A',16,'2026-27','Father_Donald',NULL,'981000015','Mother_Donald',NULL,'971000015',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-05-31 10:12:55','2026-05-31 10:12:55',NULL,NULL),(64,23,'15000','ADM2026017','Steven',NULL,'Smith',9,'2011-05-17','Male',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'9100000016',NULL,NULL,NULL,NULL,NULL,'2026-06-01','Active','Class 9','A',17,'2026-27','Father_Steven',NULL,'981000016','Mother_Steven',NULL,'971000016',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-05-31 10:12:55','2026-05-31 10:12:55',NULL,NULL),(65,23,'15000','ADM2026018','Paul',NULL,'Smith',9,'2011-06-18','Female',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'9100000017',NULL,NULL,NULL,NULL,NULL,'2026-06-01','Active','Class 9','A',18,'2026-27','Father_Paul',NULL,'981000017','Mother_Paul',NULL,'971000017',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-05-31 10:12:55','2026-05-31 10:12:55',NULL,NULL),(66,23,'15000','ADM2026019','Andrew',NULL,'Smith',9,'2011-07-19','Male',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'9100000018',NULL,NULL,NULL,NULL,NULL,'2026-06-01','Active','Class 9','A',19,'2026-27','Father_Andrew',NULL,'981000018','Mother_Andrew',NULL,'971000018',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-05-31 10:12:55','2026-05-31 10:12:55',NULL,NULL),(67,23,'15000','ADM2026020','Joshua',NULL,'Smith',9,'2011-08-20','Female',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'9100000019',NULL,NULL,NULL,NULL,NULL,'2026-06-01','Active','Class 9','A',20,'2026-27','Father_Joshua',NULL,'981000019','Mother_Joshua',NULL,'971000019',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-05-31 10:12:55','2026-05-31 10:12:55',NULL,NULL),(68,23,'15000','ADM2026021','Kenneth',NULL,'Smith',9,'2011-09-21','Male',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'9100000020',NULL,NULL,NULL,NULL,NULL,'2026-06-01','Active','Class 9','A',21,'2026-27','Father_Kenneth',NULL,'981000020','Mother_Kenneth',NULL,'971000020',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-05-31 10:12:55','2026-05-31 10:12:55',NULL,NULL),(69,23,'15000','ADM2026022','Kevin',NULL,'Smith',9,'2011-10-22','Female',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'9100000021',NULL,NULL,NULL,NULL,NULL,'2026-06-01','Active','Class 9','A',22,'2026-27','Father_Kevin',NULL,'981000021','Mother_Kevin',NULL,'971000021',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-05-31 10:12:55','2026-05-31 10:12:55',NULL,NULL),(70,23,'15000','ADM2026023','Brian',NULL,'Smith',9,'2011-11-23','Male',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'9100000022',NULL,NULL,NULL,NULL,NULL,'2026-06-01','Active','Class 9','A',23,'2026-27','Father_Brian',NULL,'981000022','Mother_Brian',NULL,'971000022',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-05-31 10:12:55','2026-05-31 10:12:55',NULL,NULL),(71,23,'15000','ADM2026024','George',NULL,'Smith',9,'2011-12-24','Female',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'9100000023',NULL,NULL,NULL,NULL,NULL,'2026-06-01','Active','Class 9','A',24,'2026-27','Father_George',NULL,'981000023','Mother_George',NULL,'971000023',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-05-31 10:12:55','2026-05-31 10:12:55',NULL,NULL),(72,23,'15000','ADM2026025','Edward',NULL,'Smith',9,'2011-01-25','Male',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'9100000024',NULL,NULL,NULL,NULL,NULL,'2026-06-01','Active','Class 9','A',25,'2026-27','Father_Edward',NULL,'981000024','Mother_Edward',NULL,'971000024',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-05-31 10:12:55','2026-05-31 10:12:55',NULL,NULL),(73,23,'15000','ADM2026026','Ronald',NULL,'Smith',9,'2011-02-26','Female',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'9100000025',NULL,NULL,NULL,NULL,NULL,'2026-06-01','Active','Class 9','A',26,'2026-27','Father_Ronald',NULL,'981000025','Mother_Ronald',NULL,'971000025',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-05-31 10:13:01','2026-05-31 10:13:01',NULL,NULL),(74,23,'15000','ADM2026027','Timothy',NULL,'Smith',9,'2011-03-27','Male',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'9100000026',NULL,NULL,NULL,NULL,NULL,'2026-06-01','Active','Class 9','A',27,'2026-27','Father_Timothy',NULL,'981000026','Mother_Timothy',NULL,'971000026',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-05-31 10:13:01','2026-05-31 10:13:01',NULL,NULL),(75,23,'15000','ADM2026028','Jason',NULL,'Smith',9,'2011-04-28','Female',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'9100000027',NULL,NULL,NULL,NULL,NULL,'2026-06-01','Active','Class 9','A',28,'2026-27','Father_Jason',NULL,'981000027','Mother_Jason',NULL,'971000027',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-05-31 10:13:01','2026-05-31 10:13:01',NULL,NULL),(76,23,'15000','ADM2026029','Jeffrey',NULL,'Smith',9,'2011-05-01','Male',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'9100000028',NULL,NULL,NULL,NULL,NULL,'2026-06-01','Active','Class 9','A',29,'2026-27','Father_Jeffrey',NULL,'981000028','Mother_Jeffrey',NULL,'971000028',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-05-31 10:13:01','2026-05-31 10:13:01',NULL,NULL),(77,23,'15000','ADM2026030','Ryan',NULL,'Smith',9,'2011-06-02','Female',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'9100000029',NULL,NULL,NULL,NULL,NULL,'2026-06-01','Active','Class 9','A',30,'2026-27','Father_Ryan',NULL,'981000029','Mother_Ryan',NULL,'971000029',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-05-31 10:13:01','2026-05-31 10:13:01',NULL,NULL),(78,23,'15000','ADM2026031','Jacob',NULL,'Smith',9,'2011-07-03','Male',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'9100000030',NULL,NULL,NULL,NULL,NULL,'2026-06-01','Active','Class 9','A',31,'2026-27','Father_Jacob',NULL,'981000030','Mother_Jacob',NULL,'971000030',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-05-31 10:13:01','2026-05-31 10:13:01',NULL,NULL),(79,23,'15000','ADM2026032','Gary',NULL,'Smith',9,'2011-08-04','Female',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'9100000031',NULL,NULL,NULL,NULL,NULL,'2026-06-01','Active','Class 9','A',32,'2026-27','Father_Gary',NULL,'981000031','Mother_Gary',NULL,'971000031',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-05-31 10:13:01','2026-05-31 10:13:01',NULL,NULL),(80,23,'15000','ADM2026033','Nicholas',NULL,'Smith',9,'2011-09-05','Male',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'9100000032',NULL,NULL,NULL,NULL,NULL,'2026-06-01','Active','Class 9','A',33,'2026-27','Father_Nicholas',NULL,'981000032','Mother_Nicholas',NULL,'971000032',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-05-31 10:13:01','2026-05-31 10:13:01',NULL,NULL),(81,23,'15000','ADM2026034','Eric',NULL,'Smith',9,'2011-10-06','Female',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'9100000033',NULL,NULL,NULL,NULL,NULL,'2026-06-01','Active','Class 9','A',34,'2026-27','Father_Eric',NULL,'981000033','Mother_Eric',NULL,'971000033',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-05-31 10:13:01','2026-05-31 10:13:01',NULL,NULL),(82,23,'15000','ADM2026035','Jonathan',NULL,'Smith',9,'2011-11-07','Male',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'9100000034',NULL,NULL,NULL,NULL,NULL,'2026-06-01','Active','Class 9','A',35,'2026-27','Father_Jonathan',NULL,'981000034','Mother_Jonathan',NULL,'971000034',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-05-31 10:13:01','2026-05-31 10:13:01',NULL,NULL),(83,23,'15000','ADM2026036','Stephen',NULL,'Smith',9,'2011-12-08','Female',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'9100000035',NULL,NULL,NULL,NULL,NULL,'2026-06-01','Active','Class 9','A',36,'2026-27','Father_Stephen',NULL,'981000035','Mother_Stephen',NULL,'971000035',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-05-31 10:13:01','2026-05-31 10:13:01',NULL,NULL),(84,23,'15000','ADM2026037','Larry',NULL,'Smith',9,'2011-01-09','Male',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'9100000036',NULL,NULL,NULL,NULL,NULL,'2026-06-01','Active','Class 9','A',37,'2026-27','Father_Larry',NULL,'981000036','Mother_Larry',NULL,'971000036',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-05-31 10:13:01','2026-05-31 10:13:01',NULL,NULL),(87,23,'15000','ADM2026038','Justin',NULL,'Smith',9,'2011-02-10','Female',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'9100000037',NULL,NULL,NULL,NULL,NULL,'2026-06-01','Active','Class 9','A',38,'2026-27','Father_Justin',NULL,'981000037','Mother_Justin',NULL,'971000037',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-05-31 10:14:28','2026-05-31 10:14:28',NULL,NULL),(88,23,'15000','ADM2026039','Scott',NULL,'Smith',9,'2011-03-11','Male',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'9100000038',NULL,NULL,NULL,NULL,NULL,'2026-06-01','Active','Class 9','A',39,'2026-27','Father_Scott',NULL,'981000038','Mother_Scott',NULL,'971000038',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-05-31 10:14:28','2026-05-31 10:14:28',NULL,NULL),(89,23,'15000','ADM2026040','Brandon',NULL,'Smith',9,'2011-04-12','Female',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'9100000039',NULL,NULL,NULL,NULL,NULL,'2026-06-01','Active','Class 9','A',40,'2026-27','Father_Brandon',NULL,'981000039','Mother_Brandon',NULL,'971000039',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-05-31 10:14:28','2026-05-31 10:14:28',NULL,NULL),(90,23,'15000','ADM2026041','Benjamin',NULL,'Smith',9,'2011-05-13','Male',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'9100000040',NULL,NULL,NULL,NULL,NULL,'2026-06-01','Active','Class 9','A',41,'2026-27','Father_Benjamin',NULL,'981000040','Mother_Benjamin',NULL,'971000040',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-05-31 10:14:28','2026-05-31 10:14:28',NULL,NULL),(91,23,'15000','ADM2026042','Samuel',NULL,'Smith',9,'2011-06-14','Female',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'9100000041',NULL,NULL,NULL,NULL,NULL,'2026-06-01','Active','Class 9','A',42,'2026-27','Father_Samuel',NULL,'981000041','Mother_Samuel',NULL,'971000041',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-05-31 10:14:28','2026-05-31 10:14:28',NULL,NULL),(92,23,'15000','ADM2026043','Gregory',NULL,'Smith',9,'2011-07-15','Male',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'9100000042',NULL,NULL,NULL,NULL,NULL,'2026-06-01','Active','Class 9','A',43,'2026-27','Father_Gregory',NULL,'981000042','Mother_Gregory',NULL,'971000042',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-05-31 10:14:28','2026-05-31 10:14:28',NULL,NULL),(93,23,'15000','ADM2026044','Frank',NULL,'Smith',9,'2011-08-16','Female',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'9100000043',NULL,NULL,NULL,NULL,NULL,'2026-06-01','Active','Class 9','A',44,'2026-27','Father_Frank',NULL,'981000043','Mother_Frank',NULL,'971000043',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-05-31 10:14:28','2026-05-31 10:14:28',NULL,NULL),(94,23,'15000','ADM2026045','Alexander',NULL,'Smith',9,'2011-09-17','Male',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'9100000044',NULL,NULL,NULL,NULL,NULL,'2026-06-01','Active','Class 9','A',45,'2026-27','Father_Alexander',NULL,'981000044','Mother_Alexander',NULL,'971000044',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-05-31 10:14:28','2026-05-31 10:14:28',NULL,NULL),(95,23,'15000','ADM2026046','Raymond',NULL,'Smith',9,'2011-10-18','Female',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'9100000045',NULL,NULL,NULL,NULL,NULL,'2026-06-01','Active','Class 9','A',46,'2026-27','Father_Raymond',NULL,'981000045','Mother_Raymond',NULL,'971000045',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-05-31 10:14:28','2026-05-31 10:14:28',NULL,NULL),(96,23,'15000','ADM2026047','Patrick',NULL,'Smith',9,'2011-11-19','Male',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'9100000046',NULL,NULL,NULL,NULL,NULL,'2026-06-01','Active','Class 9','A',47,'2026-27','Father_Patrick',NULL,'981000046','Mother_Patrick',NULL,'971000046',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-05-31 10:14:28','2026-05-31 10:14:28',NULL,NULL),(97,23,'15000','ADM2026048','Jack',NULL,'Smith',9,'2011-12-20','Female',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'9100000047',NULL,NULL,NULL,NULL,NULL,'2026-06-01','Active','Class 9','A',48,'2026-27','Father_Jack',NULL,'981000047','Mother_Jack',NULL,'971000047',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-05-31 10:14:28','2026-05-31 10:14:28',NULL,NULL),(98,23,'15000','ADM2026049','Dennis',NULL,'Smith',9,'2011-01-21','Male',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'9100000048',NULL,NULL,NULL,NULL,NULL,'2026-06-01','Active','Class 9','A',49,'2026-27','Father_Dennis',NULL,'981000048','Mother_Dennis',NULL,'971000048',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-05-31 10:14:28','2026-05-31 10:14:28',NULL,NULL),(99,23,'15000','ADM2026050','Jerry',NULL,'Smith',9,'2011-02-22','Female',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'9100000049',NULL,NULL,NULL,NULL,NULL,'2026-06-01','Active','Class 9','A',50,'2026-27','Father_Jerry',NULL,'981000049','Mother_Jerry',NULL,'971000049',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-05-31 10:14:28','2026-05-31 10:14:28',NULL,NULL),(100,23,'15000','ADM2026051','Tyler',NULL,'Smith',10,'2011-03-23','Male',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'9100000050',NULL,NULL,NULL,NULL,NULL,'2026-06-01','Active','Class 10','A',51,'2026-27','Father_Tyler',NULL,'981000050','Mother_Tyler',NULL,'971000050',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-05-31 10:14:57','2026-05-31 10:14:57',NULL,NULL),(101,23,'15000','ADM2026052','Aaron',NULL,'Smith',10,'2011-04-24','Female',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'9100000051',NULL,NULL,NULL,NULL,NULL,'2026-06-01','Active','Class 10','A',52,'2026-27','Father_Aaron',NULL,'981000051','Mother_Aaron',NULL,'971000051',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-05-31 10:14:57','2026-05-31 10:14:57',NULL,NULL),(102,23,'15000','ADM2026053','Jose',NULL,'Smith',10,'2011-05-25','Male',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'9100000052',NULL,NULL,NULL,NULL,NULL,'2026-06-01','Active','Class 10','A',53,'2026-27','Father_Jose',NULL,'981000052','Mother_Jose',NULL,'971000052',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-05-31 10:14:57','2026-05-31 10:14:57',NULL,NULL),(103,23,'15000','ADM2026054','Adam',NULL,'Smith',10,'2011-06-26','Female',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'9100000053',NULL,NULL,NULL,NULL,NULL,'2026-06-01','Active','Class 10','A',54,'2026-27','Father_Adam',NULL,'981000053','Mother_Adam',NULL,'971000053',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-05-31 10:14:57','2026-05-31 10:14:57',NULL,NULL),(104,23,'15000','ADM2026055','Nathan',NULL,'Smith',10,'2011-07-27','Male',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'9100000054',NULL,NULL,NULL,NULL,NULL,'2026-06-01','Active','Class 10','A',55,'2026-27','Father_Nathan',NULL,'981000054','Mother_Nathan',NULL,'971000054',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-05-31 10:14:57','2026-05-31 10:14:57',NULL,NULL),(105,23,'15000','ADM2026056','Henry',NULL,'Smith',10,'2011-08-28','Female',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'9100000055',NULL,NULL,NULL,NULL,NULL,'2026-06-01','Active','Class 10','A',56,'2026-27','Father_Henry',NULL,'981000055','Mother_Henry',NULL,'971000055',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-05-31 10:14:57','2026-05-31 10:14:57',NULL,NULL),(106,23,'15000','ADM2026057','Douglas',NULL,'Smith',10,'2011-09-01','Male',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'9100000056',NULL,NULL,NULL,NULL,NULL,'2026-06-01','Active','Class 10','A',57,'2026-27','Father_Douglas',NULL,'981000056','Mother_Douglas',NULL,'971000056',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-05-31 10:14:57','2026-05-31 10:14:57',NULL,NULL),(107,23,'15000','ADM2026058','Zachary',NULL,'Smith',10,'2011-10-02','Female',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'9100000057',NULL,NULL,NULL,NULL,NULL,'2026-06-01','Active','Class 10','A',58,'2026-27','Father_Zachary',NULL,'981000057','Mother_Zachary',NULL,'971000057',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-05-31 10:14:57','2026-05-31 10:14:57',NULL,NULL),(108,23,'15000','ADM2026059','Peter',NULL,'Smith',10,'2011-11-03','Male',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'9100000058',NULL,NULL,NULL,NULL,NULL,'2026-06-01','Active','Class 10','A',59,'2026-27','Father_Peter',NULL,'981000058','Mother_Peter',NULL,'971000058',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-05-31 10:14:57','2026-05-31 10:14:57',NULL,NULL),(109,23,'15000','ADM2026060','Kyle',NULL,'Smith',10,'2011-12-04','Female',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'9100000059',NULL,NULL,NULL,NULL,NULL,'2026-06-01','Active','Class 10','A',60,'2026-27','Father_Kyle',NULL,'981000059','Mother_Kyle',NULL,'971000059',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-05-31 10:14:57','2026-05-31 10:14:57',NULL,NULL),(110,23,'15000','ADM2026061','Walter',NULL,'Smith',10,'2011-01-05','Male',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'9100000060',NULL,NULL,NULL,NULL,NULL,'2026-06-01','Active','Class 10','A',61,'2026-27','Father_Walter',NULL,'981000060','Mother_Walter',NULL,'971000060',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-05-31 10:14:57','2026-05-31 10:14:57',NULL,NULL),(111,23,'15000','ADM2026062','Ethan',NULL,'Smith',10,'2011-02-06','Female',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'9100000061',NULL,NULL,NULL,NULL,NULL,'2026-06-01','Active','Class 10','A',62,'2026-27','Father_Ethan',NULL,'981000061','Mother_Ethan',NULL,'971000061',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-05-31 10:14:57','2026-05-31 10:14:57',NULL,NULL),(112,23,'15000','ADM2026063','Jeremy',NULL,'Smith',10,'2011-03-07','Male',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'9100000062',NULL,NULL,NULL,NULL,NULL,'2026-06-01','Active','Class 10','A',63,'2026-27','Father_Jeremy',NULL,'981000062','Mother_Jeremy',NULL,'971000062',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-05-31 10:14:57','2026-05-31 10:14:57',NULL,NULL),(113,23,'15000','ADM2026064','Harold',NULL,'Smith',10,'2011-04-08','Female',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'9100000063',NULL,NULL,NULL,NULL,NULL,'2026-06-01','Active','Class 10','A',64,'2026-27','Father_Harold',NULL,'981000063','Mother_Harold',NULL,'971000063',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-05-31 10:14:57','2026-05-31 10:14:57',NULL,NULL),(114,23,'15000','ADM2026065','Keith',NULL,'Smith',10,'2011-05-09','Male',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'9100000064',NULL,NULL,NULL,NULL,NULL,'2026-06-01','Active','Class 10','A',65,'2026-27','Father_Keith',NULL,'981000064','Mother_Keith',NULL,'971000064',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-05-31 10:14:57','2026-05-31 10:14:57',NULL,NULL),(115,23,'15000','ADM2026066','Christian',NULL,'Smith',10,'2011-06-10','Female',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'9100000065',NULL,NULL,NULL,NULL,NULL,'2026-06-01','Active','Class 10','A',66,'2026-27','Father_Christian',NULL,'981000065','Mother_Christian',NULL,'971000065',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-05-31 10:14:57','2026-05-31 10:14:57',NULL,NULL),(116,23,'15000','ADM2026067','Roger',NULL,'Smith',10,'2011-07-11','Male',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'9100000066',NULL,NULL,NULL,NULL,NULL,'2026-06-01','Active','Class 10','A',67,'2026-27','Father_Roger',NULL,'981000066','Mother_Roger',NULL,'971000066',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-05-31 10:14:57','2026-05-31 10:14:57',NULL,NULL),(117,23,'15000','ADM2026068','Noah',NULL,'Smith',10,'2011-08-12','Female',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'9100000067',NULL,NULL,NULL,NULL,NULL,'2026-06-01','Active','Class 10','A',68,'2026-27','Father_Noah',NULL,'981000067','Mother_Noah',NULL,'971000067',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-05-31 10:14:57','2026-05-31 10:14:57',NULL,NULL),(118,23,'15000','ADM2026069','Gerald',NULL,'Smith',10,'2011-09-13','Male',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'9100000068',NULL,NULL,NULL,NULL,NULL,'2026-06-01','Active','Class 10','A',69,'2026-27','Father_Gerald',NULL,'981000068','Mother_Gerald',NULL,'971000068',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-05-31 10:14:57','2026-05-31 10:14:57',NULL,NULL),(119,23,'15000','ADM2026070','Carl',NULL,'Smith',10,'2011-10-14','Female',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'9100000069',NULL,NULL,NULL,NULL,NULL,'2026-06-01','Active','Class 10','A',70,'2026-27','Father_Carl',NULL,'981000069','Mother_Carl',NULL,'971000069',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-05-31 10:14:57','2026-05-31 10:14:57',NULL,NULL),(120,23,'15000','ADM2026071','Terry',NULL,'Smith',10,'2011-11-15','Male',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'9100000070',NULL,NULL,NULL,NULL,NULL,'2026-06-01','Active','Class 10','A',71,'2026-27','Father_Terry',NULL,'981000070','Mother_Terry',NULL,'971000070',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-05-31 10:14:57','2026-05-31 10:14:57',NULL,NULL),(121,23,'15000','ADM2026072','Sean',NULL,'Smith',10,'2011-12-16','Female',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'9100000071',NULL,NULL,NULL,NULL,NULL,'2026-06-01','Active','Class 10','A',72,'2026-27','Father_Sean',NULL,'981000071','Mother_Sean',NULL,'971000071',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-05-31 10:14:57','2026-05-31 10:14:57',NULL,NULL),(122,23,'15000','ADM2026073','Austin',NULL,'Smith',10,'2011-01-17','Male',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'9100000072',NULL,NULL,NULL,NULL,NULL,'2026-06-01','Active','Class 10','A',73,'2026-27','Father_Austin',NULL,'981000072','Mother_Austin',NULL,'971000072',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-05-31 10:14:57','2026-05-31 10:14:57',NULL,NULL),(123,23,'15000','ADM2026074','Arthur',NULL,'Smith',10,'2011-02-18','Female',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'9100000073',NULL,NULL,NULL,NULL,NULL,'2026-06-01','Active','Class 10','A',74,'2026-27','Father_Arthur',NULL,'981000073','Mother_Arthur',NULL,'971000073',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-05-31 10:14:57','2026-05-31 10:14:57',NULL,NULL),(124,23,'15000','ADM2026075','Lawrence',NULL,'Smith',10,'2011-03-19','Male',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'9100000074',NULL,NULL,NULL,NULL,NULL,'2026-06-01','Active','Class 10','A',75,'2026-27','Father_Lawrence',NULL,'981000074','Mother_Lawrence',NULL,'971000074',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-05-31 10:14:57','2026-05-31 10:14:57',NULL,NULL),(125,23,'15000','ADM2026076','Jesse',NULL,'Smith',10,'2011-04-20','Female',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'9100000075',NULL,NULL,NULL,NULL,NULL,'2026-06-01','Active','Class 10','A',76,'2026-27','Father_Jesse',NULL,'981000075','Mother_Jesse',NULL,'971000075',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-05-31 10:14:57','2026-05-31 10:14:57',NULL,NULL),(126,23,'15000','ADM2026077','Dylan',NULL,'Smith',10,'2011-05-21','Male',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'9100000076',NULL,NULL,NULL,NULL,NULL,'2026-06-01','Active','Class 10','A',77,'2026-27','Father_Dylan',NULL,'981000076','Mother_Dylan',NULL,'971000076',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-05-31 10:14:57','2026-05-31 10:14:57',NULL,NULL),(127,23,'15000','ADM2026078','Bryan',NULL,'Smith',10,'2011-06-22','Female',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'9100000077',NULL,NULL,NULL,NULL,NULL,'2026-06-01','Active','Class 10','A',78,'2026-27','Father_Bryan',NULL,'981000077','Mother_Bryan',NULL,'971000077',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-05-31 10:14:57','2026-05-31 10:14:57',NULL,NULL),(128,23,'15000','ADM2026079','Joe',NULL,'Smith',10,'2011-07-23','Male',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'9100000078',NULL,NULL,NULL,NULL,NULL,'2026-06-01','Active','Class 10','A',79,'2026-27','Father_Joe',NULL,'981000078','Mother_Joe',NULL,'971000078',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-05-31 10:14:57','2026-05-31 10:14:57',NULL,NULL),(129,23,'15000','ADM2026080','Jordan',NULL,'Smith',10,'2011-08-24','Female',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'9100000079',NULL,NULL,NULL,NULL,NULL,'2026-06-01','Active','Class 10','A',80,'2026-27','Father_Jordan',NULL,'981000079','Mother_Jordan',NULL,'971000079',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-05-31 10:14:57','2026-05-31 10:14:57',NULL,NULL),(130,23,'15000','ADM2026081','Billy',NULL,'Smith',10,'2011-09-25','Male',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'9100000080',NULL,NULL,NULL,NULL,NULL,'2026-06-01','Active','Class 10','A',81,'2026-27','Father_Billy',NULL,'981000080','Mother_Billy',NULL,'971000080',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-05-31 10:14:57','2026-05-31 10:14:57',NULL,NULL),(131,23,'15000','ADM2026082','Bruce',NULL,'Smith',10,'2011-10-26','Female',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'9100000081',NULL,NULL,NULL,NULL,NULL,'2026-06-01','Active','Class 10','A',82,'2026-27','Father_Bruce',NULL,'981000081','Mother_Bruce',NULL,'971000081',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-05-31 10:14:57','2026-05-31 10:14:57',NULL,NULL),(132,23,'15000','ADM2026083','Albert',NULL,'Smith',10,'2011-11-27','Male',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'9100000082',NULL,NULL,NULL,NULL,NULL,'2026-06-01','Active','Class 10','A',83,'2026-27','Father_Albert',NULL,'981000082','Mother_Albert',NULL,'971000082',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-05-31 10:14:57','2026-05-31 10:14:57',NULL,NULL),(133,23,'15000','ADM2026084','Willie',NULL,'Smith',10,'2011-12-28','Female',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'9100000083',NULL,NULL,NULL,NULL,NULL,'2026-06-01','Active','Class 10','A',84,'2026-27','Father_Willie',NULL,'981000083','Mother_Willie',NULL,'971000083',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-05-31 10:14:57','2026-05-31 10:14:57',NULL,NULL),(134,23,'15000','ADM2026085','Gabriel',NULL,'Smith',10,'2011-01-01','Male',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'9100000084',NULL,NULL,NULL,NULL,NULL,'2026-06-01','Active','Class 10','A',85,'2026-27','Father_Gabriel',NULL,'981000084','Mother_Gabriel',NULL,'971000084',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-05-31 10:14:57','2026-05-31 10:14:57',NULL,NULL),(135,23,'15000','ADM2026086','Logan',NULL,'Smith',10,'2011-02-02','Female',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'9100000085',NULL,NULL,NULL,NULL,NULL,'2026-06-01','Active','Class 10','A',86,'2026-27','Father_Logan',NULL,'981000085','Mother_Logan',NULL,'971000085',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-05-31 10:14:57','2026-05-31 10:14:57',NULL,NULL),(136,23,'15000','ADM2026087','Alan',NULL,'Smith',10,'2011-03-03','Male',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'9100000086',NULL,NULL,NULL,NULL,NULL,'2026-06-01','Active','Class 10','A',87,'2026-27','Father_Alan',NULL,'981000086','Mother_Alan',NULL,'971000086',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-05-31 10:14:57','2026-05-31 10:14:57',NULL,NULL),(137,23,'15000','ADM2026088','Juan',NULL,'Smith',10,'2011-04-04','Female',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'9100000087',NULL,NULL,NULL,NULL,NULL,'2026-06-01','Active','Class 10','A',88,'2026-27','Father_Juan',NULL,'981000087','Mother_Juan',NULL,'971000087',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-05-31 10:15:14','2026-05-31 10:15:14',NULL,NULL),(138,23,'15000','ADM2026089','Wayne',NULL,'Smith',10,'2011-05-05','Male',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'9100000088',NULL,NULL,NULL,NULL,NULL,'2026-06-01','Active','Class 10','A',89,'2026-27','Father_Wayne',NULL,'981000088','Mother_Wayne',NULL,'971000088',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-05-31 10:15:14','2026-05-31 10:15:14',NULL,NULL),(139,23,'15000','ADM2026090','Roy',NULL,'Smith',10,'2011-06-06','Female',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'9100000089',NULL,NULL,NULL,NULL,NULL,'2026-06-01','Active','Class 10','A',90,'2026-27','Father_Roy',NULL,'981000089','Mother_Roy',NULL,'971000089',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-05-31 10:15:14','2026-05-31 10:15:14',NULL,NULL),(140,23,'15000','ADM2026091','Ralph',NULL,'Smith',10,'2011-07-07','Male',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'9100000090',NULL,NULL,NULL,NULL,NULL,'2026-06-01','Active','Class 10','A',91,'2026-27','Father_Ralph',NULL,'981000090','Mother_Ralph',NULL,'971000090',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-05-31 10:15:14','2026-05-31 10:15:14',NULL,NULL),(141,23,'15000','ADM2026092','Randy',NULL,'Smith',10,'2011-08-08','Female',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'9100000091',NULL,NULL,NULL,NULL,NULL,'2026-06-01','Active','Class 10','A',92,'2026-27','Father_Randy',NULL,'981000091','Mother_Randy',NULL,'971000091',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-05-31 10:15:14','2026-05-31 10:15:14',NULL,NULL),(142,23,'15000','ADM2026093','Eugene',NULL,'Smith',10,'2011-09-09','Male',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'9100000092',NULL,NULL,NULL,NULL,NULL,'2026-06-01','Active','Class 10','A',93,'2026-27','Father_Eugene',NULL,'981000092','Mother_Eugene',NULL,'971000092',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-05-31 10:15:14','2026-05-31 10:15:14',NULL,NULL),(143,23,'15000','ADM2026094','Vincent',NULL,'Smith',10,'2011-10-10','Female',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'9100000093',NULL,NULL,NULL,NULL,NULL,'2026-06-01','Active','Class 10','A',94,'2026-27','Father_Vincent',NULL,'981000093','Mother_Vincent',NULL,'971000093',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-05-31 10:15:14','2026-05-31 10:15:14',NULL,NULL),(144,23,'15000','ADM2026095','Russell',NULL,'Smith',10,'2011-11-11','Male',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'9100000094',NULL,NULL,NULL,NULL,NULL,'2026-06-01','Active','Class 10','A',95,'2026-27','Father_Russell',NULL,'981000094','Mother_Russell',NULL,'971000094',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-05-31 10:15:14','2026-05-31 10:15:14',NULL,NULL),(145,23,'15000','ADM2026096','Elijah',NULL,'Smith',10,'2011-12-12','Female',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'9100000095',NULL,NULL,NULL,NULL,NULL,'2026-06-01','Active','Class 10','A',96,'2026-27','Father_Elijah',NULL,'981000095','Mother_Elijah',NULL,'971000095',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-05-31 10:15:14','2026-05-31 10:15:14',NULL,NULL),(146,23,'15000','ADM2026097','Louis',NULL,'Smith',10,'2011-01-13','Male',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'9100000096',NULL,NULL,NULL,NULL,NULL,'2026-06-01','Active','Class 10','A',97,'2026-27','Father_Louis',NULL,'981000096','Mother_Louis',NULL,'971000096',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-05-31 10:15:14','2026-05-31 10:15:14',NULL,NULL),(147,23,'15000','ADM2026098','Bobby',NULL,'Smith',10,'2011-02-14','Female',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'9100000097',NULL,NULL,NULL,NULL,NULL,'2026-06-01','Active','Class 10','A',98,'2026-27','Father_Bobby',NULL,'981000097','Mother_Bobby',NULL,'971000097',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-05-31 10:15:14','2026-05-31 10:15:14',NULL,NULL),(148,23,'15000','ADM2026099','Philip',NULL,'Smith',10,'2011-03-15','Male',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'9100000098',NULL,NULL,NULL,NULL,NULL,'2026-06-01','Active','Class 10','A',99,'2026-27','Father_Philip',NULL,'981000098','Mother_Philip',NULL,'971000098',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-05-31 10:15:14','2026-05-31 10:15:14',NULL,NULL);
/*!40000 ALTER TABLE `students` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `subjects`
--

DROP TABLE IF EXISTS `subjects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `subjects` (
  `subject_id` int NOT NULL AUTO_INCREMENT,
  `client_id` bigint DEFAULT NULL,
  `classroom_id` int DEFAULT NULL,
  `sub_name` varchar(100) DEFAULT NULL,
  `marks` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `update_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` int DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  PRIMARY KEY (`subject_id`),
  KEY `subjects_client_master_FK` (`client_id`),
  KEY `subjects_classrooms_FK` (`classroom_id`),
  CONSTRAINT `subjects_classrooms_FK` FOREIGN KEY (`classroom_id`) REFERENCES `classrooms` (`classroom_id`),
  CONSTRAINT `subjects_client_master_FK` FOREIGN KEY (`client_id`) REFERENCES `client_master` (`client_id`)
) ENGINE=InnoDB AUTO_INCREMENT=48 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `subjects`
--

LOCK TABLES `subjects` WRITE;
/*!40000 ALTER TABLE `subjects` DISABLE KEYS */;
INSERT INTO `subjects` VALUES (34,23,10,'TELUGU',100,'2026-05-30 16:29:45','2026-05-30 16:29:45',NULL,NULL),(35,23,10,'HINDI',100,'2026-05-30 16:29:57','2026-05-30 16:29:57',NULL,NULL),(36,23,10,'MATHS',100,'2026-05-30 16:30:09','2026-05-30 16:30:09',NULL,NULL),(37,23,10,'ENGLISH',100,'2026-05-30 16:30:27','2026-05-30 16:30:27',NULL,NULL),(38,23,10,'NS',50,'2026-05-30 16:30:36','2026-05-30 16:30:36',NULL,NULL),(39,23,10,'PS',50,'2026-05-30 16:30:43','2026-05-30 16:30:43',NULL,NULL),(40,23,10,'SOCIAL',100,'2026-05-30 16:30:59','2026-05-30 16:30:59',NULL,NULL),(41,23,9,'TELUGU',100,'2026-05-30 16:31:13','2026-05-30 16:31:13',NULL,NULL),(42,23,9,'HINDI',100,'2026-05-30 16:31:21','2026-05-30 16:31:21',NULL,NULL),(43,23,9,'ENGLISH',100,'2026-05-30 16:31:28','2026-05-30 16:31:28',NULL,NULL),(44,23,9,'MATHS',100,'2026-05-30 16:31:40','2026-05-30 16:37:38',NULL,NULL),(45,23,9,'NS',50,'2026-05-30 16:31:46','2026-05-30 16:32:07',NULL,NULL),(46,23,9,'PS',50,'2026-05-30 16:31:55','2026-05-30 16:31:55',NULL,NULL),(47,23,9,'SOCIAL',100,'2026-05-30 16:32:27','2026-05-30 16:32:27',NULL,NULL);
/*!40000 ALTER TABLE `subjects` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `teacher_attendance`
--

DROP TABLE IF EXISTS `teacher_attendance`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `teacher_attendance` (
  `attendance_id` int NOT NULL AUTO_INCREMENT,
  `client_id` bigint NOT NULL,
  `schedule_id` int DEFAULT NULL,
  `teacher_id` int NOT NULL,
  `attendance_date` date NOT NULL,
  `attendance_session` varchar(20) NOT NULL DEFAULT 'Morning',
  `status` enum('Present','Late','Absent','On Leave') NOT NULL,
  `check_in` time DEFAULT NULL,
  `notes` text,
  `marked_by` int DEFAULT NULL,
  `check_in_time` time DEFAULT NULL,
  `check_out_time` time DEFAULT NULL,
  `remarks` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`attendance_id`),
  KEY `teacher_id` (`teacher_id`),
  KEY `teacher_attendance_client_master_FK` (`client_id`),
  CONSTRAINT `teacher_attendance_client_master_FK` FOREIGN KEY (`client_id`) REFERENCES `client_master` (`client_id`),
  CONSTRAINT `teacher_attendance_ibfk_1` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`teacher_id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `teacher_attendance`
--

LOCK TABLES `teacher_attendance` WRITE;
/*!40000 ALTER TABLE `teacher_attendance` DISABLE KEYS */;
INSERT INTO `teacher_attendance` VALUES (11,23,NULL,9,'2026-06-01','Morning','Present','10:09:00',NULL,58,NULL,NULL,NULL,'2026-06-01 04:39:14','2026-06-01 04:39:14'),(12,23,NULL,9,'2026-05-30','Morning','Present','14:14:35',NULL,58,NULL,NULL,NULL,'2026-06-01 08:44:35','2026-06-01 08:44:35'),(13,23,NULL,9,'2026-06-01','Afternoon','Present','14:15:51',NULL,58,NULL,NULL,NULL,'2026-06-01 08:45:51','2026-06-01 08:45:51');
/*!40000 ALTER TABLE `teacher_attendance` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `teacher_leaves`
--

DROP TABLE IF EXISTS `teacher_leaves`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `teacher_leaves` (
  `leave_id` int NOT NULL AUTO_INCREMENT,
  `client_id` bigint DEFAULT NULL,
  `teacher_id` int NOT NULL,
  `leave_date` date NOT NULL,
  `leave_type` varchar(50) NOT NULL,
  `reason` text NOT NULL,
  `status` varchar(20) DEFAULT 'Pending',
  PRIMARY KEY (`leave_id`),
  KEY `teacher_id` (`teacher_id`),
  KEY `teacher_leaves_client_master_FK` (`client_id`),
  CONSTRAINT `teacher_leaves_client_master_FK` FOREIGN KEY (`client_id`) REFERENCES `client_master` (`client_id`),
  CONSTRAINT `teacher_leaves_ibfk_1` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`teacher_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `teacher_leaves`
--

LOCK TABLES `teacher_leaves` WRITE;
/*!40000 ALTER TABLE `teacher_leaves` DISABLE KEYS */;
INSERT INTO `teacher_leaves` VALUES (3,23,13,'2026-05-31','Casual','for family issue','Approved');
/*!40000 ALTER TABLE `teacher_leaves` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `teacher_subject_assignments`
--

DROP TABLE IF EXISTS `teacher_subject_assignments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `teacher_subject_assignments` (
  `assignment_id` int NOT NULL AUTO_INCREMENT,
  `client_id` bigint DEFAULT NULL,
  `classroom_id` int NOT NULL,
  `section_id` int NOT NULL,
  `subject_id` int NOT NULL,
  `teacher_id` int NOT NULL,
  `status` enum('Active','Inactive') NOT NULL DEFAULT 'Active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`assignment_id`),
  UNIQUE KEY `uq_class_section_subject` (`classroom_id`,`section_id`,`subject_id`),
  KEY `idx_tsa_teacher_id` (`teacher_id`),
  KEY `idx_tsa_subject_id` (`subject_id`),
  KEY `fk_tsa_section` (`section_id`),
  KEY `teacher_subject_assignments_client_master_FK` (`client_id`),
  CONSTRAINT `fk_tsa_classroom` FOREIGN KEY (`classroom_id`) REFERENCES `classrooms` (`classroom_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_tsa_section` FOREIGN KEY (`section_id`) REFERENCES `sections` (`section_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_tsa_subject` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`subject_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_tsa_teacher` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`teacher_id`) ON DELETE RESTRICT,
  CONSTRAINT `teacher_subject_assignments_client_master_FK` FOREIGN KEY (`client_id`) REFERENCES `client_master` (`client_id`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `teacher_subject_assignments`
--

LOCK TABLES `teacher_subject_assignments` WRITE;
/*!40000 ALTER TABLE `teacher_subject_assignments` DISABLE KEYS */;
INSERT INTO `teacher_subject_assignments` VALUES (4,23,9,7,43,9,'Active','2026-05-31 01:46:50','2026-05-31 01:46:50'),(5,23,9,7,42,13,'Active','2026-05-31 03:59:55','2026-05-31 03:59:55'),(6,23,9,7,44,10,'Active','2026-05-31 04:00:17','2026-05-31 04:00:17'),(7,23,9,7,45,14,'Active','2026-05-31 04:00:38','2026-05-31 04:00:38'),(8,23,9,7,46,10,'Active','2026-05-31 04:00:50','2026-05-31 04:00:50'),(9,23,9,7,47,11,'Active','2026-05-31 04:01:30','2026-05-31 04:01:30'),(10,23,9,7,41,12,'Active','2026-05-31 04:01:49','2026-05-31 04:01:49'),(11,23,10,10,37,9,'Active','2026-05-31 04:02:02','2026-05-31 04:02:02'),(12,23,10,10,40,11,'Active','2026-05-31 04:02:13','2026-05-31 04:02:13'),(13,23,10,10,36,10,'Active','2026-05-31 04:02:28','2026-05-31 04:02:28'),(14,23,10,10,35,13,'Active','2026-05-31 04:02:46','2026-05-31 04:02:46'),(16,23,10,11,34,12,'Active','2026-05-31 04:03:10','2026-05-31 04:03:10'),(17,23,10,10,39,10,'Active','2026-05-31 04:03:48','2026-05-31 04:03:48'),(18,23,10,10,38,14,'Active','2026-05-31 04:04:41','2026-05-31 04:04:41');
/*!40000 ALTER TABLE `teacher_subject_assignments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `teacher_subjects`
--

DROP TABLE IF EXISTS `teacher_subjects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `teacher_subjects` (
  `id` int NOT NULL AUTO_INCREMENT,
  `client_id` bigint DEFAULT NULL,
  `teacher_id` int NOT NULL,
  `subject_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_teacher_subject` (`teacher_id`,`subject_id`),
  KEY `idx_teacher_subjects_teacher_id` (`teacher_id`),
  KEY `idx_teacher_subjects_subject_id` (`subject_id`),
  KEY `teacher_subjects_client_master_FK` (`client_id`),
  CONSTRAINT `fk_teacher_subjects_subject` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`subject_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_teacher_subjects_teacher` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`teacher_id`) ON DELETE CASCADE,
  CONSTRAINT `teacher_subjects_client_master_FK` FOREIGN KEY (`client_id`) REFERENCES `client_master` (`client_id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `teacher_subjects`
--

LOCK TABLES `teacher_subjects` WRITE;
/*!40000 ALTER TABLE `teacher_subjects` DISABLE KEYS */;
INSERT INTO `teacher_subjects` VALUES (2,23,9,37,'2026-05-31 01:06:24','2026-05-31 01:06:24'),(3,23,9,43,'2026-05-31 01:06:24','2026-05-31 01:06:24'),(4,23,10,36,'2026-05-31 03:51:23','2026-05-31 03:51:23'),(5,23,10,39,'2026-05-31 03:51:23','2026-05-31 03:51:23'),(6,23,10,44,'2026-05-31 03:51:23','2026-05-31 03:51:23'),(7,23,10,46,'2026-05-31 03:51:23','2026-05-31 03:51:23'),(8,23,11,40,'2026-05-31 03:52:26','2026-05-31 03:52:26'),(9,23,11,47,'2026-05-31 03:52:26','2026-05-31 03:52:26'),(10,23,12,34,'2026-05-31 03:53:47','2026-05-31 03:53:47'),(11,23,12,41,'2026-05-31 03:53:47','2026-05-31 03:53:47'),(12,23,13,35,'2026-05-31 03:54:51','2026-05-31 03:54:51'),(13,23,13,42,'2026-05-31 03:54:51','2026-05-31 03:54:51'),(14,23,14,38,'2026-05-31 03:56:16','2026-05-31 03:56:16'),(15,23,14,45,'2026-05-31 03:56:16','2026-05-31 03:56:16');
/*!40000 ALTER TABLE `teacher_subjects` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `teachers`
--

DROP TABLE IF EXISTS `teachers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `teachers` (
  `teacher_id` int NOT NULL AUTO_INCREMENT,
  `client_id` bigint DEFAULT NULL,
  `first_name` varchar(50) NOT NULL,
  `middle_name` varchar(50) DEFAULT NULL,
  `last_name` varchar(50) NOT NULL,
  `date_of_birth` date NOT NULL,
  `gender` enum('Male','Female','Other') NOT NULL,
  `nationality` varchar(50) DEFAULT NULL,
  `religion` varchar(50) DEFAULT NULL,
  `phone_number` varchar(15) NOT NULL,
  `alternate_phone` varchar(15) DEFAULT NULL,
  `email` varchar(100) NOT NULL,
  `address_line1` varchar(100) DEFAULT NULL,
  `address_line2` varchar(100) DEFAULT NULL,
  `city` varchar(50) DEFAULT NULL,
  `state` varchar(50) DEFAULT NULL,
  `postal_code` varchar(10) DEFAULT NULL,
  `country` varchar(50) DEFAULT NULL,
  `date_of_joining` date NOT NULL,
  `employment_status` enum('Active','Inactive','Resigned','Retired') NOT NULL,
  `department` varchar(50) DEFAULT NULL,
  `designation` varchar(50) DEFAULT NULL,
  `qualification` text,
  `experience_years` int DEFAULT '0',
  `subjects_taught` text,
  `salary` decimal(10,2) DEFAULT NULL,
  `bank_account_number` varchar(20) DEFAULT NULL,
  `ifsc_code` varchar(20) DEFAULT NULL,
  `achievements` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` int DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  PRIMARY KEY (`teacher_id`),
  UNIQUE KEY `email` (`email`),
  KEY `teachers_client_master_FK` (`client_id`),
  CONSTRAINT `teachers_client_master_FK` FOREIGN KEY (`client_id`) REFERENCES `client_master` (`client_id`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `teachers`
--

LOCK TABLES `teachers` WRITE;
/*!40000 ALTER TABLE `teachers` DISABLE KEYS */;
INSERT INTO `teachers` VALUES (9,23,'SREEDEVI',NULL,'ANNAREDDY','2001-10-30','Female',NULL,NULL,'8341897793',NULL,'SREEVENKAT0804@GMAIL.COM',NULL,NULL,NULL,NULL,NULL,NULL,'2025-06-01','Active',NULL,NULL,NULL,0,'ENGLISH, ENGLISH',25000.00,'20187508385','sbin0006694',NULL,'2026-05-31 01:06:24','2026-05-31 01:06:24',NULL,NULL),(10,23,'VIVEKANADAN REDDY',NULL,'YERUVA','1993-08-01','Male',NULL,NULL,'9912381646',NULL,'saivivek1994@gmail.com',NULL,NULL,NULL,NULL,NULL,NULL,'2026-01-01','Active',NULL,NULL,NULL,0,'MATHS, MATHS, PS, PS',35000.00,NULL,NULL,NULL,'2026-05-31 03:51:23','2026-05-31 03:51:23',NULL,NULL),(11,23,'RAVITEJA',NULL,'MADASU','1993-01-01','Male',NULL,NULL,'89016415617',NULL,'raviteja1993@gmail.com',NULL,NULL,NULL,NULL,NULL,NULL,'2026-01-01','Active',NULL,NULL,NULL,0,'SOCIAL, SOCIAL',NULL,NULL,NULL,NULL,'2026-05-31 03:52:26','2026-05-31 03:52:26',NULL,NULL),(12,23,'HARI KRISHNA',NULL,'K','1994-01-01','Male',NULL,NULL,'8012345679',NULL,'harikrishna.k@gmail.com',NULL,NULL,NULL,NULL,NULL,NULL,'2026-01-01','Active',NULL,NULL,NULL,0,'TELUGU, TELUGU',NULL,NULL,NULL,NULL,'2026-05-31 03:53:47','2026-05-31 03:53:47',NULL,NULL),(13,23,'KASIM SAHEB',NULL,'SIRICHAPALA','1993-01-01','Male',NULL,NULL,'7288822253',NULL,'kasimsaheb.sirichapala@gmail.com',NULL,NULL,NULL,NULL,NULL,NULL,'2026-01-01','Active',NULL,NULL,NULL,0,'HINDI, HINDI',NULL,NULL,NULL,NULL,'2026-05-31 03:54:51','2026-05-31 03:54:51',NULL,NULL),(14,23,'SIVAREDDY',NULL,'E','1993-01-01','Male',NULL,NULL,'9012345678',NULL,'SIVAREDDYENAKONDA@GMAIL.COM',NULL,NULL,NULL,NULL,NULL,NULL,'2026-01-01','Active',NULL,NULL,NULL,0,'NS, NS',NULL,NULL,NULL,NULL,'2026-05-31 03:56:16','2026-05-31 03:56:16',NULL,NULL);
/*!40000 ALTER TABLE `teachers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `transports`
--

DROP TABLE IF EXISTS `transports`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `transports` (
  `transport_id` int NOT NULL AUTO_INCREMENT,
  `client_id` bigint DEFAULT NULL,
  `vehicleNumber` varchar(20) NOT NULL,
  `driverName` int DEFAULT NULL,
  `route` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `capacity` int DEFAULT NULL,
  `departureTime` varchar(100) DEFAULT NULL,
  `status` enum('Active','Inactive') DEFAULT 'Active',
  PRIMARY KEY (`transport_id`),
  KEY `transports_FK` (`client_id`),
  KEY `transports_FK_1` (`driverName`),
  CONSTRAINT `transports_client_master_FK` FOREIGN KEY (`client_id`) REFERENCES `client_master` (`client_id`),
  CONSTRAINT `transports_FK_1` FOREIGN KEY (`driverName`) REFERENCES `staff` (`staff_id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `transports`
--

LOCK TABLES `transports` WRITE;
/*!40000 ALTER TABLE `transports` DISABLE KEYS */;
/*!40000 ALTER TABLE `transports` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_entity_links`
--

DROP TABLE IF EXISTS `user_entity_links`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_entity_links` (
  `link_id` int NOT NULL AUTO_INCREMENT,
  `client_id` bigint NOT NULL,
  `login_id` int NOT NULL,
  `entity_type` enum('TEACHER','STUDENT','PARENT','STAFF') NOT NULL,
  `entity_id` int NOT NULL,
  `relationship` varchar(50) DEFAULT NULL,
  `status` enum('ACTIVE','INACTIVE') DEFAULT 'ACTIVE',
  PRIMARY KEY (`link_id`),
  KEY `user_entity_links_client_master_FK` (`client_id`),
  CONSTRAINT `user_entity_links_client_master_FK` FOREIGN KEY (`client_id`) REFERENCES `client_master` (`client_id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_entity_links`
--

LOCK TABLES `user_entity_links` WRITE;
/*!40000 ALTER TABLE `user_entity_links` DISABLE KEYS */;
INSERT INTO `user_entity_links` VALUES (1,23,55,'TEACHER',8,'TEACHER','ACTIVE'),(2,23,56,'PARENT',41,'vahidha','ACTIVE'),(3,23,57,'PARENT',42,'FATHER','ACTIVE'),(4,23,58,'TEACHER',9,'TEACHER','ACTIVE'),(5,23,59,'TEACHER',10,'TEACHER','ACTIVE'),(6,23,60,'TEACHER',11,'TEACHER','ACTIVE'),(7,23,61,'TEACHER',12,'TEACHER','ACTIVE'),(8,23,62,'TEACHER',13,'TEACHER','ACTIVE'),(9,23,63,'TEACHER',14,'TEACHER','ACTIVE');
/*!40000 ALTER TABLE `user_entity_links` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'school'
--
--
-- WARNING: can't read the INFORMATION_SCHEMA.libraries table. It's most probably an old server 8.0.41.
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-01 20:02:38
