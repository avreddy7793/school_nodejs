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
  CONSTRAINT `fk_class_schedule_classroom` FOREIGN KEY (`classroom_id`) REFERENCES `classrooms` (`classroom_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_class_schedule_period` FOREIGN KEY (`period_id`) REFERENCES `session_periods` (`period_id`),
  CONSTRAINT `fk_class_schedule_section` FOREIGN KEY (`section_id`) REFERENCES `sections` (`section_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_class_schedule_session` FOREIGN KEY (`session_id`) REFERENCES `school_sessions` (`session_id`),
  CONSTRAINT `fk_class_schedule_subject` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`subject_id`) ON DELETE CASCADE,
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
  CONSTRAINT `classrooms_client_master_FK` FOREIGN KEY (`client_id`) REFERENCES `global`.`client_master` (`client_id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `classrooms`
--

LOCK TABLES `classrooms` WRITE;
/*!40000 ALTER TABLE `classrooms` DISABLE KEYS */;
INSERT INTO `classrooms` VALUES (1,23,'1 st Class',100,'Class Room','2024-12-10 04:03:28','2024-12-10 04:04:46'),(2,23,'2 st Class',100,'Class Room','2024-12-10 04:03:32','2024-12-10 04:04:46'),(3,23,'3 st Class',100,'Class Room','2024-12-10 04:03:35','2024-12-10 04:04:46'),(5,23,'5 st Class',100,'Class Room','2024-12-10 04:03:43','2024-12-10 04:04:46'),(6,23,'6 st Class',100,'Class Room','2024-12-10 04:03:47','2024-12-10 04:04:46'),(7,23,'7 st Class',100,'Class Room','2024-12-10 04:03:51','2024-12-10 04:04:46'),(8,23,'8 st Class',100,'Class Room','2024-12-10 04:03:54','2024-12-10 04:04:46'),(9,23,'9 st Class',100,'Class Room','2024-12-10 04:03:56','2024-12-10 04:04:46'),(10,23,'10 st Class',100,'Class Room','2024-12-10 04:03:59','2024-12-10 04:04:46');
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
  CONSTRAINT `hostel_rooms_FK` FOREIGN KEY (`client_id`) REFERENCES `global`.`client_master` (`client_id`)
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
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
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
  CONSTRAINT `fk_sections_classroom` FOREIGN KEY (`classroom_id`) REFERENCES `classrooms` (`classroom_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
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
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
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
  `status` enum('Present','Late','Absent','Excused') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `check_in` time DEFAULT NULL,
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
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
  CONSTRAINT `subjects_client_master_FK` FOREIGN KEY (`client_id`) REFERENCES `global`.`client_master` (`client_id`)
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
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `teacher_leaves`
--

LOCK TABLES `teacher_leaves` WRITE;
/*!40000 ALTER TABLE `teacher_leaves` DISABLE KEYS */;
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
  CONSTRAINT `fk_tsa_classroom` FOREIGN KEY (`classroom_id`) REFERENCES `classrooms` (`classroom_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_tsa_section` FOREIGN KEY (`section_id`) REFERENCES `sections` (`section_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_tsa_subject` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`subject_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_tsa_teacher` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`teacher_id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `teacher_subject_assignments`
--

LOCK TABLES `teacher_subject_assignments` WRITE;
/*!40000 ALTER TABLE `teacher_subject_assignments` DISABLE KEYS */;
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
  CONSTRAINT `fk_teacher_subjects_subject` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`subject_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_teacher_subjects_teacher` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`teacher_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `teacher_subjects`
--

LOCK TABLES `teacher_subjects` WRITE;
/*!40000 ALTER TABLE `teacher_subjects` DISABLE KEYS */;
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
  CONSTRAINT `teachers_client_master_FK` FOREIGN KEY (`client_id`) REFERENCES `global`.`client_master` (`client_id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `teachers`
--

LOCK TABLES `teachers` WRITE;
/*!40000 ALTER TABLE `teachers` DISABLE KEYS */;
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

-- Dump completed on 2026-05-30 23:10:04
