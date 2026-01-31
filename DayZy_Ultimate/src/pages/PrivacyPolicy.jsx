import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./PrivacyPolicy.css";

export default function PrivacyPolicy() {
  const [language, setLanguage] = useState("th");
  const navigate = useNavigate();

  return (
    <div className="privacy-container">
      <div className="privacy-header">
        <h1>{language === "th" ? "นโยบายความเป็นส่วนตัว" : "Privacy Policy"}</h1>
        <p>
          {language === "th"
            ? "ข้อมูลเกี่ยวกับวิธีการรักษาความเป็นส่วนตัวของคุณ"
            : "Information about how we protect your privacy"}
        </p>
      </div>

      <div className="privacy-content">
        <div className="lang-toggle">
          <button
            className={language === "th" ? "active" : ""}
            onClick={() => setLanguage("th")}
          >
            ไทย
          </button>
          <button
            className={language === "en" ? "active" : ""}
            onClick={() => setLanguage("en")}
          >
            English
          </button>
        </div>

        <button className="back-button" onClick={() => navigate("/about")}>
          ← {language === "th" ? "ย้อนกลับ" : "Back"}
        </button>

        {language === "th" ? (
          <>
            <div className="section">
              <h2>บทนำ</h2>
              <p>
                เรามีความสำคัญต่อความเป็นส่วนตัวของคุณ นโยบายนี้อธิบายวิธีการที่เรา
                เก็บรวบรวม ใช้ และปกป้องข้อมูลส่วนบุคคลของคุณ
              </p>
            </div>

            <div className="section">
              <h2>ข้อมูลที่เรารวบรวม</h2>
              <p>เรารวบรวมข้อมูลต่อไปนี้เพื่อให้บริการของเรา:</p>
              <ul>
                <li>ข้อมูลส่วนบุคคล: ชื่อ อีเมล เบอร์โทรศัพท์ ที่อยู่</li>
                <li>ข้อมูลการใช้งาน: วิธีการที่คุณใช้เว็บไซต์และบริการของเรา</li>
                <li>ข้อมูลเทคนิค: IP address, browser type, operating system</li>
                <li>ข้อมูลจากคุกกี้ และเครื่องมือติดตามอื่น</li>
              </ul>
            </div>

            <div className="section">
              <h2>วิธีการใช้ข้อมูลของคุณ</h2>
              <p>เราใช้ข้อมูลของคุณเพื่อ:</p>
              <ul>
                <li>ให้บริการและรักษาบัญชีของคุณ</li>
                <li>ปรับปรุงและพัฒนาบริการของเรา</li>
                <li>ส่งข้อมูลและการอัปเดตที่เกี่ยวข้อง</li>
                <li>ตรวจสอบความปลอดภัยและป้องกันการฉ้อโกง</li>
                <li>ปฏิบัติตามข้อกำหนดทางกฎหมาย</li>
              </ul>
            </div>

            <div className="section">
              <h2>การคุ้มครองข้อมูล</h2>
              <p>
                เราใช้มาตรการความปลอดภัยหลายชั้นเพื่อปกป้องข้อมูลของคุณ
                รวมถึง encryption, secure servers, และการควบคุมการเข้าถึง
              </p>
            </div>

            <div className="section">
              <h2>การแบ่งปันข้อมูล</h2>
              <p>
                เราจะไม่แบ่งปันข้อมูลส่วนบุคคลของคุณกับบุคคลที่สามโดยไม่ได้รับความยินยอมจากคุณ
                ยกเว้นในกรณีที่กฎหมายกำหนดให้
              </p>
            </div>

            <div className="section">
              <h2>สิทธิของคุณ</h2>
              <p>คุณมีสิทธิในการ:</p>
              <ul>
                <li>เข้าถึงข้อมูลส่วนบุคคลของคุณ</li>
                <li>แก้ไขข้อมูลที่ไม่ถูกต้อง</li>
                <li>ลบข้อมูลของคุณ</li>
                <li>ยกเลิกการติดตามการตลาด</li>
              </ul>
            </div>

            <div className="section">
              <h2>การติดต่อเรา</h2>
              <p>
                หากคุณมีคำถามเกี่ยวกับนโยบายนี้ โปรดติดต่อเราที่ privacy@company.com
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="section">
              <h2>Introduction</h2>
              <p>
                We care about your privacy. This policy explains how we collect,
                use, and protect your personal information.
              </p>
            </div>

            <div className="section">
              <h2>Information We Collect</h2>
              <p>We collect the following information to provide our services:</p>
              <ul>
                <li>Personal Information: Name, email, phone number, address</li>
                <li>Usage Data: How you use our website and services</li>
                <li>Technical Data: IP address, browser type, operating system</li>
                <li>Cookies and other tracking tools</li>
              </ul>
            </div>

            <div className="section">
              <h2>How We Use Your Data</h2>
              <p>We use your information to:</p>
              <ul>
                <li>Provide and maintain our services</li>
                <li>Improve and develop our offerings</li>
                <li>Send relevant updates and communications</li>
                <li>Monitor security and prevent fraud</li>
                <li>Comply with legal obligations</li>
              </ul>
            </div>

            <div className="section">
              <h2>Data Security</h2>
              <p>
                We implement multiple layers of security measures to protect your
                information, including encryption, secure servers, and access
                controls.
              </p>
            </div>

            <div className="section">
              <h2>Data Sharing</h2>
              <p>
                We will not share your personal information with third parties
                without your consent, except as required by law.
              </p>
            </div>

            <div className="section">
              <h2>Your Rights</h2>
              <p>You have the right to:</p>
              <ul>
                <li>Access your personal information</li>
                <li>Correct inaccurate data</li>
                <li>Delete your information</li>
                <li>Opt-out of marketing communications</li>
              </ul>
            </div>

            <div className="section">
              <h2>Contact Us</h2>
              <p>
                If you have questions about this policy, please contact us at
                5dayzy67@gmail.com
              </p>
            </div>
          </>
        )}
      </div>

      <div className="privacy-footer">
        <p>© 2025 DayZy. All rights reserved. | Last updated: December 31, 2025</p>
      </div>
    </div>
  );
}