import React from "react";
// Change: QRCode ki jagah QRCodeSVG ya QRCodeCanvas import karein
import { QRCodeSVG } from "qrcode.react"; 

const PaymentQR = () => {
    // Aapki image wala real data
    const upiID = "samarthruraledu@jsb";
    const name = "SAMARTH RURAL EDUCATIONAL INSTITUTE";
    
    // Standard UPI URI Format: upi://pay?pa=VPA&pn=NAME
    const paymentData = `upi://pay?pa=${upiID}&pn=${encodeURIComponent(name)}&cu=INR`;

    return (
        <div style={{
            border: "1px solid #ccc",
            padding: "20px",
            borderRadius: "10px",
            textAlign: "center",
            background: "#f9f9f9",
            color: "#333"
        }}>
            <h3 style={{marginBottom: '15px'}}>Official College QR Code</h3>

            {/* Change: Component ka naam QRCodeSVG rakhein */}
            <QRCodeSVG value={paymentData} size={200} includeMargin={true} />

            <div style={{marginTop: '15px'}}>
                <p style={{fontWeight: 'bold', margin: '5px 0'}}>{name}</p>
                <p style={{color: '#666'}}>UPI ID: <strong>{upiID}</strong></p>
                <p style={{fontSize: '12px', color: 'red', marginTop: '10px'}}>
                    * Please share the transaction ID after successful payment.
                </p>
            </div>
        </div>
    );
};

export default PaymentQR;