import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./TermsOfService.css";

export default function TermsOfService() {
  const [language, setLanguage] = useState("th");
  const navigate = useNavigate();

  return (
    <div className="terms-container">
      <div className="terms-header">
        <h1>{language === "th" ? "เงื่อนไขการให้บริการ" : "Terms of Service"}</h1>
        <p>
          {language === "th"
            ? "กรุณาอ่านเงื่อนไขการให้บริการของเราให้เข้าใจ"
            : "Please read our terms of service carefully"}
        </p>
      </div>

      <div className="terms-content">
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
              <h2>1. ยอมรับเงื่อนไข</h2>
              <p>
                โดยการใช้บริการของเรา คุณยอมรับและตกลงที่จะปฏิบัติตามเงื่อนไขการให้บริการนี้
                หากคุณไม่เห็นด้วยกับเงื่อนไขใด ๆ โปรดหยุดการใช้บริการของเรา
              </p>
            </div>

            <div className="section">
              <h2>2. ลิขสิทธิ์และลิขสิทธิ์</h2>
              <p>
                เนื้อหาทั้งหมดในแพลตฟอร์มของเรา รวมถึงข้อความ กราฟิก โลโก้ และรูปภาพ
                เป็นทรัพย์สินของ DayZy และได้รับการปกป้องโดยกฎหมายลิขสิทธิ์
              </p>
            </div>

            <div className="section">
              <h2>3. การใช้งานที่อนุญาต</h2>
              <p>
                คุณได้รับอนุญาตให้ใช้บริการของเราเพื่อวัตถุประสงค์ส่วนบุคคลและไม่เชิงพาณิชย์เท่านั้น
                คุณไม่ได้รับอนุญาตให้:
              </p>
              <ul>
                <li>ลอกเลียนแบบ ดัดแปลง หรือสร้างอนุพันธ์จากบริการของเรา</li>
                <li>ขายหรือให้บริการเพื่อหาประโยชน์</li>
                <li>ใช้บริการในวิธีที่ผิดกฎหมายหรือเป็นการทำให้เสื่อมลงของระบบ</li>
                <li>ส่งข้อมูลที่เป็นอันตรายหรือโจมตี</li>
                <li>รวบรวมข้อมูลหรือเนื้อหาโดยไม่ได้รับอนุญาต</li>
              </ul>
            </div>

            <div className="section">
              <h2>4. บัญชีผู้ใช้</h2>
              <p>
                คุณต้องสร้างบัญชีเพื่อใช้บริการของเรา คุณต้องรักษาความลับของรหัสผ่านของคุณ
                และรับผิดชอบต่อกิจกรรมทั้งหมดภายใต้บัญชีของคุณ
              </p>
            </div>

            <div className="section">
              <h2>5. การจำกัดความรับผิดชอบ</h2>
              <p>
                บริการของเราให้บริการตามที่มี เราไม่รับประกันความถูกต้องหรือความครบถ้วนของเนื้อหา
                เราจะไม่รับผิดชอบต่อความเสียหายใด ๆ ที่เกิดจากการใช้บริการของเรา
              </p>
            </div>

            <div className="section">
              <h2>6. การเปลี่ยนแปลงบริการ</h2>
              <p>
                เรามีสิทธิ์ที่จะเปลี่ยนแปลง ปรับปรุง หรือเลิกใช้บริการได้ตลอดเวลา
                โดยอาจมีหรือไม่มีการแจ้งเตือนก็ได้
              </p>
            </div>

            <div className="section">
              <h2>7. การสิ้นสุดบริการ</h2>
              <p>
                เรามีสิทธิ์ที่จะยกเลิกหรือระงับบัญชีของคุณหากคุณละเมิดเงื่อนไขเหล่านี้
                หรือกิจกรรมที่ไม่เหมาะสม
              </p>
            </div>

            <div className="section">
              <h2>8. กฎหมายที่บังคับใช้</h2>
              <p>
                เงื่อนไขเหล่านี้จะถูกควบคุมโดยกฎหมายของประเทศไทย
                และคุณยินยอมที่จะยอมรับการตัดสินของศาล
              </p>
            </div>

            <div className="section">
              <h2>9. การติดต่อ</h2>
              <p>
                หากคุณมีคำถามเกี่ยวกับเงื่อนไขเหล่านี้ โปรดติดต่อเราที่ support@dayzy.com
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="section">
              <h2>1. Acceptance of Terms</h2>
              <p>
                By using our service, you agree to be bound by these terms of service.
                If you do not agree to any of these terms, please stop using our service.
              </p>
            </div>

            <div className="section">
              <h2>2. Intellectual Property Rights</h2>
              <p>
                All content on our platform, including text, graphics, logos, and images,
                are the property of DayZy and protected by copyright law.
              </p>
            </div>

            <div className="section">
              <h2>3. Permitted Use</h2>
              <p>
                You are only permitted to use our service for personal and non-commercial purposes.
                You are not allowed to:
              </p>
              <ul>
                <li>Copy, modify, or create derivatives of our service</li>
                <li>Sell or offer the service for profit</li>
                <li>Use the service in illegal ways or to harm the system</li>
                <li>Send harmful or malicious content</li>
                <li>Collect data or content without authorization</li>
              </ul>
            </div>

            <div className="section">
              <h2>4. User Accounts</h2>
              <p>
                You must create an account to use our service. You are responsible for keeping
                your password confidential and all activities under your account.
              </p>
            </div>

            <div className="section">
              <h2>5. Limitation of Liability</h2>
              <p>
                Our service is provided as-is. We do not guarantee the accuracy or completeness
                of any content. We are not liable for any damages arising from your use of our service.
              </p>
            </div>

            <div className="section">
              <h2>6. Service Modifications</h2>
              <p>
                We reserve the right to modify, improve, or discontinue our service at any time,
                with or without notice.
              </p>
            </div>

            <div className="section">
              <h2>7. Termination of Service</h2>
              <p>
                We reserve the right to suspend or terminate your account if you violate
                these terms or engage in inappropriate activities.
              </p>
            </div>

            <div className="section">
              <h2>8. Governing Law</h2>
              <p>
                These terms are governed by the laws of Thailand and you agree to submit
                to the jurisdiction of Thai courts.
              </p>
            </div>

            <div className="section">
              <h2>9. Contact Us</h2>
              <p>
                If you have questions about these terms, please contact us at 5dayzy67@gmail.com
              </p>
            </div>
          </>
        )}
      </div>

      <div className="terms-footer">
        <p>© 2025 DayZy. All rights reserved. | Last updated: December 31, 2025</p>
      </div>
    </div>
  );
}