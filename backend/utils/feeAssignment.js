const mongoose = require("mongoose");
const { Fee, FeeStructure } = require("../models/Fee");
const Student = require("../models/Student");

// Helper function to assign fees to students without fees
const assignMissingFees = async () => {
    try {
        console.log("🔍 Checking for students without fees...");
        
        // Get all students
        const students = await Student.find({ isActive: true }).populate("user", "firstName lastName");
        
        // Get current academic year
        const currentYear = new Date().getFullYear();
        const academicYear = `${currentYear}-${currentYear + 1}`;
        
        let assignedCount = 0;
        
        for (const student of students) {
            // Check if student already has fees assigned
            const existingFee = await Fee.findOne({ student: student._id });
            
            if (!existingFee) {
                // Find applicable fee structure
                const feeStructure = await FeeStructure.findOne({
                    $or: [
                        { department: student.department },
                        { department: "All" }
                    ],
                    course: student.course || "B.E.",
                    academicYear: academicYear,
                    isActive: true
                }).sort({ createdAt: -1 });
                
                if (feeStructure) {
                    const newFee = await Fee.create({
                        student: student._id,
                        feeStructure: feeStructure._id,
                        academicYear: academicYear,
                        semester: student.semester,
                        totalAmount: feeStructure.totalAmount,
                        paidAmount: 0,
                        dueAmount: feeStructure.totalAmount,
                        status: "Pending",
                        dueDate: feeStructure.dueDate
                    });
                    
                    console.log(`✅ Fee assigned to ${student.user.firstName} ${student.user.lastName} (${student.rollNumber}): ₹${feeStructure.totalAmount}`);
                    assignedCount++;
                } else {
                    console.log(`⚠️  No fee structure found for ${student.user.firstName} ${student.user.lastName} (${student.department})`);
                }
            }
        }
        
        console.log(`🎉 Assigned fees to ${assignedCount} students`);
        return assignedCount;
        
    } catch (error) {
        console.error("❌ Error assigning missing fees:", error);
        throw error;
    }
};

module.exports = { assignMissingFees };
