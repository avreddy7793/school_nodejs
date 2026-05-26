-- MySQL dump 10.13  Distrib 8.0.19, for Win64 (x86_64)
--
-- Host: localhost    Database: school
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
  CONSTRAINT `attendance_client_master_FK` FOREIGN KEY (`client_id`) REFERENCES `global`.`client_master` (`client_id`),
  CONSTRAINT `attendance_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`),
  CONSTRAINT `attendance_ibfk_2` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`teacher_id`)
) ENGINE=InnoDB AUTO_INCREMENT=198 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `attendance`
--

LOCK TABLES `attendance` WRITE;
/*!40000 ALTER TABLE `attendance` DISABLE KEYS */;
INSERT INTO `attendance` VALUES (137,23,29,1,'2024-12-01','Present','Present',NULL,NULL,NULL,NULL,NULL),(138,23,30,1,'2024-12-01','Present','Leave',NULL,NULL,NULL,NULL,NULL),(139,23,31,1,'2024-12-01','Late','Present',NULL,NULL,NULL,NULL,NULL),(140,23,32,1,'2024-12-01','Present','Present',NULL,NULL,NULL,NULL,NULL),(141,23,33,1,'2024-12-01','Present','Present',NULL,NULL,NULL,NULL,NULL),(142,23,29,1,'2024-12-12','Absent','Absent',NULL,NULL,NULL,NULL,NULL),(143,23,30,1,'2024-12-12','Absent','Absent',NULL,NULL,NULL,NULL,NULL),(144,23,31,1,'2024-12-12','Absent','Absent',NULL,NULL,NULL,NULL,NULL),(145,23,32,1,'2024-12-12','Absent','Absent',NULL,NULL,NULL,NULL,NULL),(146,23,33,1,'2024-12-12','Absent','Absent',NULL,NULL,NULL,NULL,NULL),(147,23,29,1,'2024-12-02','Present','Absent',NULL,NULL,NULL,NULL,NULL),(148,23,30,1,'2024-12-02','Absent','Present',NULL,NULL,NULL,NULL,NULL),(149,23,31,1,'2024-12-02','Present','Absent',NULL,NULL,NULL,NULL,NULL),(150,23,32,1,'2024-12-02','Present','Present',NULL,NULL,NULL,NULL,NULL),(151,23,33,1,'2024-12-02','Present','Present',NULL,NULL,NULL,NULL,NULL),(152,23,29,1,'2024-12-03','Present','Absent',NULL,NULL,NULL,NULL,NULL),(153,23,30,1,'2024-12-03','Present','Absent',NULL,NULL,NULL,NULL,NULL),(154,23,31,1,'2024-12-03','Present','Absent',NULL,NULL,NULL,NULL,NULL),(155,23,32,1,'2024-12-03','Present','Absent',NULL,NULL,NULL,NULL,NULL),(156,23,33,1,'2024-12-03','Present','Absent',NULL,NULL,NULL,NULL,NULL),(157,23,29,1,'2024-12-04','Present','Present',NULL,NULL,NULL,NULL,NULL),(158,23,30,1,'2024-12-04','Present','Present',NULL,NULL,NULL,NULL,NULL),(159,23,31,1,'2024-12-04','Present','Absent',NULL,NULL,NULL,NULL,NULL),(160,23,32,1,'2024-12-04','Absent','Present',NULL,NULL,NULL,NULL,NULL),(161,23,33,1,'2024-12-04','Present','Present',NULL,NULL,NULL,NULL,NULL),(162,23,29,1,'2024-12-05','Present','Absent',NULL,NULL,NULL,NULL,NULL),(163,23,30,1,'2024-12-05','Absent','Present',NULL,NULL,NULL,NULL,NULL),(164,23,31,1,'2024-12-05','Present','Absent',NULL,NULL,NULL,NULL,NULL),(165,23,32,1,'2024-12-05','Absent','Present',NULL,NULL,NULL,NULL,NULL),(166,23,33,1,'2024-12-05','Present','Absent',NULL,NULL,NULL,NULL,NULL),(167,23,29,1,'2024-12-06','Present','Absent',NULL,NULL,NULL,NULL,NULL),(168,23,30,1,'2024-12-06','Absent','Present',NULL,NULL,NULL,NULL,NULL),(169,23,31,1,'2024-12-06','Absent','Present',NULL,NULL,NULL,NULL,NULL),(170,23,32,1,'2024-12-06','Present','Absent',NULL,NULL,NULL,NULL,NULL),(171,23,33,1,'2024-12-06','Present','Present',NULL,NULL,NULL,NULL,NULL),(172,23,29,1,'2024-12-16','Present','Absent',NULL,NULL,NULL,NULL,NULL),(173,23,30,1,'2024-12-16','Absent','Absent',NULL,NULL,NULL,NULL,NULL),(174,23,31,1,'2024-12-16','Present','Present',NULL,NULL,NULL,NULL,NULL),(175,23,32,1,'2024-12-16','Present','Absent',NULL,NULL,NULL,NULL,NULL),(176,23,33,1,'2024-12-16','Absent','Present',NULL,NULL,NULL,NULL,NULL),(178,23,29,1,'2024-12-17','Present','Absent',NULL,NULL,NULL,NULL,NULL),(179,23,30,1,'2024-12-17','Present','Present',NULL,NULL,NULL,NULL,NULL),(180,23,31,1,'2024-12-17','Absent','Present',NULL,NULL,NULL,NULL,NULL),(181,23,32,1,'2024-12-17','Present','Absent',NULL,NULL,NULL,NULL,NULL),(182,23,33,1,'2024-12-17','Present','Absent',NULL,NULL,NULL,NULL,NULL),(183,23,29,1,'2024-12-07','Present','Present',NULL,NULL,NULL,NULL,NULL),(184,23,30,1,'2024-12-07','Present','Present',NULL,NULL,NULL,NULL,NULL),(185,23,31,1,'2024-12-07','Present','Present',NULL,NULL,NULL,NULL,NULL),(186,23,32,1,'2024-12-07','Present','Present',NULL,NULL,NULL,NULL,NULL),(187,23,33,1,'2024-12-07','Present','Present',NULL,NULL,NULL,NULL,NULL),(188,23,29,1,'2025-01-02','Present','Present',NULL,NULL,NULL,NULL,NULL),(189,23,30,1,'2025-01-02','Present','Present',NULL,NULL,NULL,NULL,NULL),(190,23,31,1,'2025-01-02','Present','Present',NULL,NULL,NULL,NULL,NULL),(191,23,32,1,'2025-01-02','Present','Absent',NULL,NULL,NULL,NULL,NULL),(192,23,33,1,'2025-01-02','Present','Present',NULL,NULL,NULL,NULL,NULL),(193,23,29,1,'2025-01-03','Present','Absent',NULL,NULL,NULL,NULL,NULL),(194,23,30,1,'2025-01-03','Absent','Absent',NULL,NULL,NULL,NULL,NULL),(195,23,31,1,'2025-01-03','Present','Absent',NULL,NULL,NULL,NULL,NULL),(196,23,32,1,'2025-01-03','Absent','Present',NULL,NULL,NULL,NULL,NULL),(197,23,33,1,'2025-01-03','Present','Absent',NULL,NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `attendance` ENABLE KEYS */;
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
  `session_id` int NOT NULL,
  `period_id` int NOT NULL,
  `teacher_id` int NOT NULL,
  `subject` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `grade` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `section` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `day_of_week` tinyint DEFAULT NULL,
  `schedule_date` date DEFAULT NULL,
  `status` enum('Active','Inactive','Cancelled') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Active',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`schedule_id`),
  UNIQUE KEY `uq_class_schedule_slot` (`classroom_id`,`session_id`,`period_id`,`day_of_week`,`schedule_date`),
  KEY `idx_class_schedule_classroom` (`classroom_id`),
  KEY `idx_class_schedule_session` (`session_id`),
  KEY `idx_class_schedule_period` (`period_id`),
  KEY `idx_class_schedule_teacher` (`teacher_id`),
  CONSTRAINT `fk_class_schedule_classroom` FOREIGN KEY (`classroom_id`) REFERENCES `classrooms` (`classroom_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_class_schedule_period` FOREIGN KEY (`period_id`) REFERENCES `session_periods` (`period_id`),
  CONSTRAINT `fk_class_schedule_session` FOREIGN KEY (`session_id`) REFERENCES `school_sessions` (`session_id`),
  CONSTRAINT `fk_class_schedule_teacher` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`teacher_id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `class_schedule`
--

LOCK TABLES `class_schedule` WRITE;
/*!40000 ALTER TABLE `class_schedule` DISABLE KEYS */;
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
  `subject` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `grade` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `section` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `schedule` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('Active','Inactive','Cancelled') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`session_id`),
  KEY `idx_classroom_sessions_client_id` (`client_id`),
  KEY `idx_classroom_sessions_classroom_id` (`classroom_id`),
  KEY `idx_classroom_sessions_teacher_id` (`teacher_id`),
  KEY `idx_classroom_sessions_status` (`status`),
  CONSTRAINT `fk_classroom_sessions_classroom` FOREIGN KEY (`classroom_id`) REFERENCES `classrooms` (`classroom_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_classroom_sessions_teacher` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`teacher_id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
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
  CONSTRAINT `classrooms_client_master_FK` FOREIGN KEY (`client_id`) REFERENCES `global`.`client_master` (`client_id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `classrooms`
--

LOCK TABLES `classrooms` WRITE;
/*!40000 ALTER TABLE `classrooms` DISABLE KEYS */;
INSERT INTO `classrooms` VALUES (1,23,'1 st Class',100,'Class Room','2024-12-10 04:03:28','2024-12-10 04:04:46'),(2,23,'2 st Class',100,'Class Room','2024-12-10 04:03:32','2024-12-10 04:04:46'),(3,23,'3 st Class',100,'Class Room','2024-12-10 04:03:35','2024-12-10 04:04:46'),(5,23,'5 st Class',100,'Class Room','2024-12-10 04:03:43','2024-12-10 04:04:46'),(6,23,'6 st Class',100,'Class Room','2024-12-10 04:03:47','2024-12-10 04:04:46'),(7,23,'7 st Class',100,'Class Room','2024-12-10 04:03:51','2024-12-10 04:04:46'),(8,23,'8 st Class',100,'Class Room','2024-12-10 04:03:54','2024-12-10 04:04:46'),(9,23,'9 st Class',100,'Class Room','2024-12-10 04:03:56','2024-12-10 04:04:46'),(10,23,'10 st Class',100,'Class Room','2024-12-10 04:03:59','2024-12-10 04:04:46'),(11,23,'11 st Class',100,'Class Room','2024-12-10 04:05:01','2024-12-10 04:05:01');
/*!40000 ALTER TABLE `classrooms` ENABLE KEYS */;
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
  CONSTRAINT `exam_results_client_master_FK` FOREIGN KEY (`client_id`) REFERENCES `global`.`client_master` (`client_id`),
  CONSTRAINT `exam_results_ibfk_1` FOREIGN KEY (`exam_id`) REFERENCES `exams` (`exam_id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `exam_results`
--

LOCK TABLES `exam_results` WRITE;
/*!40000 ALTER TABLE `exam_results` DISABLE KEYS */;
INSERT INTO `exam_results` VALUES (9,23,6,40,57,'PASS','2026-05-24 16:26:11'),(10,23,5,32,46,'PASS','2026-05-24 16:35:19'),(11,23,4,38,77,'PASS','2026-05-24 16:35:24'),(12,23,8,39,55,'PASS','2026-05-25 02:54:27'),(13,23,8,30,70,'PASS','2026-05-25 02:54:35'),(14,23,8,31,0,'ABSENT','2026-05-25 02:54:40'),(15,23,9,41,66,'PASS','2026-05-26 10:53:34');
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
  CONSTRAINT `exams_client_master_FK` FOREIGN KEY (`client_id`) REFERENCES `global`.`client_master` (`client_id`),
  CONSTRAINT `exams_ibfk_1` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`subject_id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `exams`
--

LOCK TABLES `exams` WRITE;
/*!40000 ALTER TABLE `exams` DISABLE KEYS */;
INSERT INTO `exams` VALUES (4,23,27,'2026-05-25',100,35,60,'2026-05-24 15:46:31'),(5,23,28,'2026-05-25',100,35,60,'2026-05-24 16:00:45'),(6,23,29,'2026-05-21',100,35,60,'2026-05-24 16:26:01'),(8,23,30,'2026-05-22',100,35,60,'2026-05-25 02:54:14'),(9,23,31,'2026-05-18',100,35,60,'2026-05-26 10:53:21');
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
  CONSTRAINT `fee_records_FK` FOREIGN KEY (`client_id`) REFERENCES `global`.`client_master` (`client_id`),
  CONSTRAINT `fee_records_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`) ON DELETE CASCADE,
  CONSTRAINT `fee_records_ibfk_2` FOREIGN KEY (`classroom_id`) REFERENCES `classrooms` (`classroom_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fee_records`
--

LOCK TABLES `fee_records` WRITE;
/*!40000 ALTER TABLE `fee_records` DISABLE KEYS */;
INSERT INTO `fee_records` VALUES (11,23,'FEE0001',40,7,'2026',5000.00,100.00,500.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,5600.00,1000.00,4600.00);
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
  KEY `hostel_payments_room_idx` (`room_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `hostel_payments`
--

LOCK TABLES `hostel_payments` WRITE;
/*!40000 ALTER TABLE `hostel_payments` DISABLE KEYS */;
INSERT INTO `hostel_payments` VALUES (1,23,6,40,3,'HST20260525140346220','2026-05-25','OTHER','Cash',5000.00,NULL,'2026-05-25 08:33:46'),(2,23,7,39,3,'HST20260525223128702','2026-05-25','FULL','Cash',10000.00,NULL,'2026-05-25 17:01:28'),(3,23,8,29,4,'HST20260525223609128','2026-05-25','PARTIAL','Cash',2000.00,NULL,'2026-05-25 17:06:09');
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
  CONSTRAINT `hostel_rooms_FK` FOREIGN KEY (`client_id`) REFERENCES `global`.`client_master` (`client_id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `hostel_rooms`
--

LOCK TABLES `hostel_rooms` WRITE;
/*!40000 ALTER TABLE `hostel_rooms` DISABLE KEYS */;
INSERT INTO `hostel_rooms` VALUES (3,23,'A101',3,2,'Male','10000'),(4,23,'A102',3,1,'Male','10000');
/*!40000 ALTER TABLE `hostel_rooms` ENABLE KEYS */;
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
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `parent_student_links`
--

LOCK TABLES `parent_student_links` WRITE;
/*!40000 ALTER TABLE `parent_student_links` DISABLE KEYS */;
INSERT INTO `parent_student_links` VALUES (1,23,56,41,'vahidha');
/*!40000 ALTER TABLE `parent_student_links` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `school_sessions`
--

DROP TABLE IF EXISTS `school_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `school_sessions` (
  `session_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sort_order` int NOT NULL DEFAULT '1',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`session_id`),
  UNIQUE KEY `uq_school_sessions_name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `school_sessions`
--

LOCK TABLES `school_sessions` WRITE;
/*!40000 ALTER TABLE `school_sessions` DISABLE KEYS */;
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
-- Table structure for table `session_periods`
--

DROP TABLE IF EXISTS `session_periods`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `session_periods` (
  `period_id` int NOT NULL AUTO_INCREMENT,
  `session_id` int NOT NULL,
  `period_number` int NOT NULL,
  `label` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `duration_minutes` int NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`period_id`),
  UNIQUE KEY `uq_session_periods` (`session_id`,`period_number`),
  CONSTRAINT `fk_session_periods_session` FOREIGN KEY (`session_id`) REFERENCES `school_sessions` (`session_id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `session_periods`
--

LOCK TABLES `session_periods` WRITE;
/*!40000 ALTER TABLE `session_periods` DISABLE KEYS */;
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
  CONSTRAINT `staff_FK` FOREIGN KEY (`client_id`) REFERENCES `global`.`client_master` (`client_id`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `staff`
--

LOCK TABLES `staff` WRITE;
/*!40000 ALTER TABLE `staff` DISABLE KEYS */;
INSERT INTO `staff` VALUES (1,23,'EMP0001','John','Doe','DRIVER','9876543210','john.doe@example.com','123 Main Street, Springfield','2024-06-15','ACTIVATE','2024-12-17 15:19:24','2024-12-18 10:16:29'),(2,23,'EMP0002','KASIM SAHEB ','SIRICHAPAPLA','ADMINISTRATOR','728-882-2253','KASIMS007@GMAIL.COM','DARSI','2023-12-12','ACTIVATE','2024-12-17 17:15:07','2024-12-18 10:16:34'),(9,23,'EMP-0003','SUBBAREDDY','MARAM REDDY','DRIVER','123-456-7899','','','2202-12-12','ACTIVATE','2024-12-18 10:57:06','2024-12-18 10:57:06'),(12,23,'EMP-0010','CHANDRA SHAKAR','DUGGIREDDY','DRIVER','123-546-6511','CHANDRASKAKAR@GMAIL.COM','','2022-12-12','ACTIVATE','2024-12-18 10:59:00','2024-12-18 10:59:00'),(13,23,'EMP-0013','dhruva','na','DRIVER','998-866-4466','suryaa@gmail.com','','2022-12-12','ACTIVATE','2024-12-18 11:00:16','2024-12-18 11:00:16'),(14,23,'EMP-0014','VIVEK REDDY','YERUVA','ADMINISTRATOR','991-238-1646','yeruva.vivek@gmail.com','darsi','1994-08-01','ACTIVATE','2024-12-18 11:31:01','2024-12-18 11:31:01');
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
  `status` enum('Present','Late','Absent','Excused') COLLATE utf8mb4_unicode_ci NOT NULL,
  `check_in` time DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `marked_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`student_attendance_id`),
  UNIQUE KEY `uq_student_attendance` (`schedule_id`,`student_id`,`attendance_date`),
  KEY `fk_student_attendance_student` (`student_id`),
  CONSTRAINT `fk_student_attendance_schedule` FOREIGN KEY (`schedule_id`) REFERENCES `class_schedule` (`schedule_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_student_attendance_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student_attendance`
--

LOCK TABLES `student_attendance` WRITE;
/*!40000 ALTER TABLE `student_attendance` DISABLE KEYS */;
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
  CONSTRAINT `student_room_assignments_FK` FOREIGN KEY (`client_id`) REFERENCES `global`.`client_master` (`client_id`),
  CONSTRAINT `student_room_assignments_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`) ON DELETE CASCADE,
  CONSTRAINT `student_room_assignments_ibfk_2` FOREIGN KEY (`room_id`) REFERENCES `hostel_rooms` (`room_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student_room_assignments`
--

LOCK TABLES `student_room_assignments` WRITE;
/*!40000 ALTER TABLE `student_room_assignments` DISABLE KEYS */;
INSERT INTO `student_room_assignments` VALUES (6,23,40,3,'2025-06-05','2026-05-25'),(7,23,39,3,'2026-05-01',NULL),(8,23,29,4,'2025-07-25',NULL);
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
  CONSTRAINT `students_client_master_FK` FOREIGN KEY (`client_id`) REFERENCES `global`.`client_master` (`client_id`),
  CONSTRAINT `students_FK` FOREIGN KEY (`transport_id`) REFERENCES `transports` (`transport_id`)
) ENGINE=InnoDB AUTO_INCREMENT=42 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `students`
--

LOCK TABLES `students` WRITE;
/*!40000 ALTER TABLE `students` DISABLE KEYS */;
INSERT INTO `students` VALUES (29,23,'2500','ADM001','John',NULL,'Doe',1,'2010-05-15','Male','O+','American','Christianity',NULL,NULL,'123 Elm St',NULL,'Springfield','Illinois','62701','USA','1234567890','0987654321','john.doe@example.com','Jane Doe','Mother','1234567890','2023-09-01','Active','Grade 8','A',1,'2023-2024','Mark Doe','Engineer','1234567890','Sarah Doe','Teacher','0987654321',NULL,NULL,NULL,'Grade 8','Springfield Middle School','95%',NULL,NULL,'Up-to-date',180,5,'Science Club','Basketball','Math Olympiad Winner','2024-12-10 04:10:20','2024-12-16 07:50:58',101,101),(30,23,'2500','ADM002','Emily','Anne','Smith',2,'2011-07-20','Female','A+','British','Christianity',NULL,NULL,'456 Pine Ave','Apt 2B','London','England','WC2N','UK','2345678901','1234567890','emily.smith@example.com','David Smith','Father','2345678901','2023-09-01','Active','Grade 7','B',2,'2023-2024','David Smith','Doctor','2345678901','Sophia Smith','Lawyer','1234567890',NULL,NULL,NULL,'Grade 7','London Primary School','90%',NULL,'Asthma','Up-to-date',175,10,'Drama Club','Soccer','Drama Competition Winner','2024-12-10 04:10:20','2024-12-16 07:50:58',102,102),(31,23,'3000','ADM003','Michael',NULL,'Brown',2,'2009-11-05','Male','B+','Canadian','Christianity',NULL,NULL,'789 Oak Rd',NULL,'Toronto','Ontario','M5G','Canada','3456789012',NULL,'michael.brown@example.com','Linda Brown','Mother','3456789012','2023-09-01','Active','Grade 9','C',3,'2023-2024','Peter Brown','Businessman','3456789012','Linda Brown','Nurse','3456789012',NULL,NULL,NULL,'Grade 9','Toronto High School','85%',NULL,NULL,'Up-to-date',170,8,'Robotics Club','Swimming','Robotics Competition Winner','2024-12-10 04:10:20','2024-12-16 07:50:58',103,103),(32,23,'3500','ADM004','Sophia',NULL,'Lee',3,'2012-03-10','Female','AB+','Chinese','Buddhism',NULL,NULL,'101 Maple St',NULL,'Beijing','Beijing','100000','China','4567890123',NULL,'sophia.lee@example.com','Jack Lee','Father','4567890123','2023-09-01','Active','Grade 6','A',4,'2023-2024','Jack Lee','Engineer','4567890123','Lily Lee','Accountant','4567890123',NULL,NULL,NULL,'Grade 6','Beijing Elementary School','98%','Peanuts',NULL,'Up-to-date',185,3,'Art Club','Badminton','Art Contest Winner','2024-12-10 04:10:20','2024-12-16 07:50:58',104,104),(33,23,'4000','ADM005','Sai','Prakash Reddy','Srungarapu',5,'2008-12-25','Male','O-','Australian','Christianity',NULL,NULL,'202 Birch Ln',NULL,'Sydney','New South Wales','2000','Australia','5678901234',NULL,'liam.johnson@example.com','Harry Johnson','Entrepreneur','5678901234','2023-09-01','Active','Grade 10','B',5,'2023-2024','Harry Johnson','Entrepreneur','5678901234','Emma Johnson','Teacher','5678901234',NULL,NULL,NULL,'Grade 10','Sydney High School','88%','Lactose',NULL,'Up-to-date',160,15,'Music Club','Cricket','Music Competition Winner','2024-12-10 04:10:20','2026-05-23 03:39:39',105,105),(38,23,'2500','ADM1001','Aarav','Kumar','Sharma',1,'2011-05-15','Male','O+','Indian','Hindu',NULL,NULL,'123 School Road','Near Main Gate','Hyderabad','Telangana','500001','India','9876543210','9876543211','aarav.sharma@example.com','Rajesh Sharma','Father','9876543210','2026-05-23','Active','Grade 9','A',12,'2026-2027','Rajesh Sharma','Engineer','9876543210','Priya Sharma','Teacher','9876543211','Rajesh Sharma','Father','9876543210','Grade 9','Springfield School','92%','None','None','Up-to-date',0,0,'Science Club','Cricket','Math Olympiad finalist','2026-05-23 04:44:08','2026-05-23 04:44:08',NULL,NULL),(39,23,'3000','ADM1002','venkatareddy',NULL,'Annareddy',2,'1993-06-05','Male','O+','INNDIA','HINDU',NULL,NULL,'DARSI','DARSI','DARSI','AP','523247','INDIA','99665336638',NULL,'venkatareddybd@gmail.com','GANDIREDDY','GANGIREDDY','9885906723','2026-05-23','Active','9','A',1001,'2026-2027','NA','NA','1234567890','NA','AN','NA','GANDIREDDY','FATHER','9885906723','9','NAN','NA','NA','NA','NA',0,0,'NA','NA','NA','2026-05-23 06:21:21','2026-05-23 06:21:21',NULL,NULL),(40,23,'5000','ADM1003','SURENDRA REDDY',NULL,'K',7,'2010-05-05','Male','B-',NULL,NULL,NULL,NULL,'NAN','AN','NA','NAN','NA','NA','9876543211','NA','AVREDDY.SMILE@GMAIL.COM','NA','NAN','NA','2026-05-01','Active','B SESSION','B',10102,'2026-2027','NA','NAN','AN','NA','NAN','NA','NAN','AN','NAN','B','NAN','AN','NAN','NA','NA',0,0,'NAN','AN','NA','2026-05-24 16:22:39','2026-05-24 16:22:39',NULL,NULL),(41,23,'5000','ADM1004','KALAM',NULL,'SIRICHAPALA',5,'2020-06-25','Male','O+','india','musilem',NULL,NULL,'darsi','darsi','darsi','ap','523247','india','1234567890','9985282092','KASIMS007@GMAIL.COM','kasim',NULL,'7288822253','2026-05-26','Active','9','A',1991,'2026-2027','Kasim Saheb','Job','9985282092','na','na','na','na','vahidha','7288822253','9','na','na','na','na','na',0,0,'na','na','na','2026-05-26 09:45:19','2026-05-26 09:45:19',NULL,NULL);
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
  `marks` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `update_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` int DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  PRIMARY KEY (`subject_id`),
  KEY `subjects_client_master_FK` (`client_id`),
  KEY `subjects_classrooms_FK` (`classroom_id`),
  CONSTRAINT `subjects_classrooms_FK` FOREIGN KEY (`classroom_id`) REFERENCES `classrooms` (`classroom_id`),
  CONSTRAINT `subjects_client_master_FK` FOREIGN KEY (`client_id`) REFERENCES `global`.`client_master` (`client_id`)
) ENGINE=InnoDB AUTO_INCREMENT=34 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `subjects`
--

LOCK TABLES `subjects` WRITE;
/*!40000 ALTER TABLE `subjects` DISABLE KEYS */;
INSERT INTO `subjects` VALUES (27,23,1,'TELUGU','100','2026-05-24 15:45:52','2026-05-24 15:45:52',NULL,NULL),(28,23,3,'TELUGU','100','2026-05-24 15:50:41','2026-05-24 15:50:41',NULL,NULL),(29,23,7,'ENGLISH','100','2026-05-24 16:25:54','2026-05-24 16:25:54',NULL,NULL),(30,23,2,'ENGLISH','100','2026-05-25 02:54:09','2026-05-25 02:54:09',NULL,NULL),(31,23,5,'TELUGU','100','2026-05-26 10:17:10','2026-05-26 10:17:10',NULL,NULL),(32,23,5,'ENGLISH','100','2026-05-26 10:43:55','2026-05-26 10:43:55',NULL,NULL),(33,23,5,'HINDI','100','2026-05-26 10:44:03','2026-05-26 10:44:03',NULL,NULL);
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
  `teacher_id` int NOT NULL,
  `attendance_date` date NOT NULL,
  `status` enum('Present','Absent','On Leave') NOT NULL,
  `check_in_time` time DEFAULT NULL,
  `check_out_time` time DEFAULT NULL,
  `remarks` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`attendance_id`),
  KEY `teacher_id` (`teacher_id`),
  KEY `teacher_attendance_client_master_FK` (`client_id`),
  CONSTRAINT `teacher_attendance_client_master_FK` FOREIGN KEY (`client_id`) REFERENCES `global`.`client_master` (`client_id`),
  CONSTRAINT `teacher_attendance_ibfk_1` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`teacher_id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `teacher_attendance`
--

LOCK TABLES `teacher_attendance` WRITE;
/*!40000 ALTER TABLE `teacher_attendance` DISABLE KEYS */;
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
  CONSTRAINT `teacher_leaves_client_master_FK` FOREIGN KEY (`client_id`) REFERENCES `global`.`client_master` (`client_id`),
  CONSTRAINT `teacher_leaves_ibfk_1` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`teacher_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `teacher_leaves`
--

LOCK TABLES `teacher_leaves` WRITE;
/*!40000 ALTER TABLE `teacher_leaves` DISABLE KEYS */;
INSERT INTO `teacher_leaves` VALUES (1,23,1,'2024-12-09','Sick Leave','Fever and cold, unable to attend.','Approved');
/*!40000 ALTER TABLE `teacher_leaves` ENABLE KEYS */;
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
  CONSTRAINT `teachers_client_master_FK` FOREIGN KEY (`client_id`) REFERENCES `global`.`client_master` (`client_id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `teachers`
--

LOCK TABLES `teachers` WRITE;
/*!40000 ALTER TABLE `teachers` DISABLE KEYS */;
INSERT INTO `teachers` VALUES (1,23,'Alice','Marie','Johnson','1985-03-15','Female','American','Christianity','9876543210','8765432109','alice.johnson@example.com','123 Maple St',NULL,'Springfield','Illinois','62701','USA','2010-06-01','Active','Mathematics','Math Teacher','M.Sc Mathematics',12,'Algebra, Geometry, Calculus',55000.00,'123456789012','ABC001234','Best Teacher Award 2020','2024-12-08 15:06:30','2024-12-08 15:06:30',NULL,NULL),(2,23,'Bob',NULL,'Smith','1978-12-10','Male','Canadian','Atheism','9123456789','8765432100','bob.smith@example.com','456 Oak Ave',NULL,'Vancouver','British Columbia','V5K 0A1','Canada','2008-09-15','Active','Science','Physics Teacher','Ph.D Physics',15,'Physics, Chemistry',60000.00,'234567890123','DEF009876','Published 5 Research Papers','2024-12-08 15:06:30','2024-12-08 15:06:30',NULL,NULL),(3,23,'Charlie','Lee','Kim','1990-07-20','Male','South Korean','Buddhism','9234567890',NULL,'charlie.kim@example.com','789 Pine Rd','Suite 101','Seoul','Seoul','11010','South Korea','2015-01-10','Active','Computer Science','IT Teacher','M.Tech Computer Science',8,'Programming, Networking',52000.00,'345678901234','GHI008765','Winner of National Coding Competition','2024-12-08 15:06:30','2024-12-08 15:06:30',NULL,NULL),(4,23,'Diana','Grace','Taylor','1980-04-18','Female','British','Christianity','9345678901','8123456789','diana.taylor@example.com','123 Birch Ln','Flat 2B','London','England','E1 7NT','United Kingdom','2005-05-22','Active','English','English Teacher','M.A. English Literature',18,'English, Creative Writing',58000.00,'456789012345','JKL005432','Author of 3 Books','2024-12-08 15:06:30','2024-12-08 15:06:30',NULL,NULL),(5,23,'Emily','Rose','Clark','1995-11-25','Female','Australian','Christianity','9456789012','7234567890','emily.clark@example.com','321 Elm Dr',NULL,'Sydney','New South Wales','2000','Australia','2020-08-15','Active','History','History Teacher','B.A. History',3,'World History, Ancient Civilizations',45000.00,'567890123456','MNO003210','Young Teacher of the Year 2021','2024-12-08 15:06:30','2024-12-08 15:06:30',NULL,NULL),(8,23,'SREEDEVI','ANNAREDDY','A','2001-10-31','Female','INDIAN',NULL,'8341897793',NULL,'SREEVENKAT0804@GMAIL.COM','darsi','darsi','darsi','ap','523247','india','2009-01-01','Active','ENGLISH','SENIOR','MED',5,'ENGLISH, HINDI',25000.00,'20187508385','sbin0006694','na','2026-05-26 01:43:11','2026-05-26 01:43:11',NULL,NULL);
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
  CONSTRAINT `transports_FK` FOREIGN KEY (`client_id`) REFERENCES `global`.`client_master` (`client_id`),
  CONSTRAINT `transports_FK_1` FOREIGN KEY (`driverName`) REFERENCES `staff` (`staff_id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `transports`
--

LOCK TABLES `transports` WRITE;
/*!40000 ALTER TABLE `transports` DISABLE KEYS */;
INSERT INTO `transports` VALUES (13,23,'AP37BA9824',12,'DARSI-RAJAMPALLI',55,'08:00','Active');
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
  PRIMARY KEY (`link_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_entity_links`
--

LOCK TABLES `user_entity_links` WRITE;
/*!40000 ALTER TABLE `user_entity_links` DISABLE KEYS */;
INSERT INTO `user_entity_links` VALUES (1,23,55,'TEACHER',8,'TEACHER','ACTIVE'),(2,23,56,'PARENT',41,'vahidha','ACTIVE');
/*!40000 ALTER TABLE `user_entity_links` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'school'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-05-26 16:25:19
