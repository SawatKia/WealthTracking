// components/i18next/translations/th.ts
export default {
  
  profile: {
    loading: "กำลังโหลดโปรไฟล์...",
    username: "ชื่อผู้ใช้",
    email: "อีเมล",
    birthday: "วันเกิด",
    password: "รหัสผ่าน",
    currentPassword: "รหัสผ่านปัจจุบัน:",
    newPassword: "รหัสผ่านใหม่:",
    confirmNewPassword: "ยืนยันรหัสผ่านใหม่:",
    save: "บันทึก",
    cancel: "ยกเลิก",
    delete: "ลบบัญชี",
    logout: "ออกจากระบบ",
    deleteAccount: "ลบบัญชี",
    deleteConfirm: "คุณแน่ใจหรือไม่ที่จะลบบัญชี? การกระทำนี้ไม่สามารถย้อนกลับได้",
    enterPassword: "กรอกรหัสผ่านเพื่อยืนยัน:",
    required: "จำเป็นต้องกรอก",
    selectDate: "เลือกวันที่",
    success: {
      update: "อัปเดตโปรไฟล์สำเร็จ",
      delete: "ลบบัญชีสำเร็จ"
    },
    error: {
      update: "ไม่สามารถอัปเดตโปรไฟล์ได้ กรุณาลองใหม่อีกครั้ง",
      delete: "ไม่สามารถลบบัญชีได้ กรุณาตรวจสอบรหัสผ่านและลองใหม่อีกครั้ง",
      password: "รหัสผ่านใหม่ไม่ตรงกัน"
    }
  },

    login: {

      title: "ยินดีต้อนรับกลับ",
      email: "อีเมล",
      password: "รหัสผ่าน",
      rememberMe: "จดจำฉัน",
      forgotPassword: "ลืมรหัสผ่าน?",
      loginButton: "เข้าสู่ระบบ",
      noAccount: "ยังไม่มีบัญชี?",
      signupLink: "สมัครสมาชิก",
      errors: {
        emailRequired: "กรุณากรอกอีเมล",
        emailInvalid: "รูปแบบอีเมลไม่ถูกต้อง",
        passwordRequired: "กรุณากรอกรหัสผ่าน",
        loginFailed: "เข้าสู่ระบบล้มเหลว: "
      }
    },

    signup: {

      title: "สร้างบัญชี",
      nationalId: "เลขบัตรประชาชน",
      username: "ชื่อผู้ใช้",
      email: "อีเมล",
      password: "รหัสผ่าน",
      confirmPassword: "ยืนยันรหัสผ่าน",
      signupButton: "สมัครสมาชิก",
      haveAccount: "มีบัญชีอยู่แล้ว?",
      loginLink: "เข้าสู่ระบบ",
      errors: {
        nationalIdRequired: "กรุณากรอกเลขบัตรประชาชน",
        nationalIdInvalid: "รูปแบบเลขบัตรประชาชนไม่ถูกต้อง",
        usernameRequired: "กรุณากรอกชื่อผู้ใช้",
        emailRequired: "กรุณากรอกอีเมล",
        emailInvalid: "รูปแบบอีเมลไม่ถูกต้อง",
        passwordRequired: "กรุณากรอกรหัสผ่าน",
        passwordLength: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร",
        passwordMatch: "รหัสผ่านไม่ตรงกัน",
        signupFailed: "สมัครสมาชิกล้มเหลว: "
      }
    },

  debt: {

    summary: {
      totalDebt: "ยอดหนี้รวม",
      totalMonthlyPayment: "ยอดผ่อนชำระต่อเดือน",
      baht: "บาท",
      perMonth: "บาท/เดือน"
    },
    details: {
      title: "รายละเอียดหนี้",
      installments: "งวดที่ชำระแล้ว",
      loanPrincipal: "ยอดเงินกู้",
      totalPaid: "ยอดชำระแล้ว",
      remainingBalance: "ยอดคงเหลือ",
      paymentChannel: "ช่องทางการชำระ",
      buttons: {
        update: "อัพเดทข้อมูล",
        delete: "ลบ"
      }
    },
    modal: {
      deleteConfirm: "คุณแน่ใจหรือไม่ที่จะลบรายการหนี้นี้?",
      cancel: "ยกเลิก",
      delete: "ลบ"
    }
  },

  addDebt: {
    title: "เพิ่มรายการหนี้",
    form: {
      debtName: "ชื่อรายการหนี้",
      loanPrincipal: "ยอดเงินกู้",
      totalInstallments: "จำนวนงวดทั้งหมด",
      currentInstallment: "งวดที่ชำระแล้ว",
      paymentChannel: "ช่องทางการชำระ",
      selectBank: "เลือกธนาคาร"
    },
    validation: {
      required: "กรุณากรอกข้อมูล",
      numberOnly: "กรุณากรอกตัวเลขเท่านั้น",
      positiveNumber: "กรุณากรอกตัวเลขที่มากกว่า 0",
      installmentValid: "งวดที่ชำระแล้วต้องไม่เกินจำนวนงวดทั้งหมด"
    },
    buttons: {
      add: "เพิ่มรายการหนี้",
      cancel: "ยกเลิก"
    },
    messages: {
      success: "เพิ่มรายการหนี้สำเร็จ",
      error: "ไม่สามารถเพิ่มรายการหนี้ได้ กรุณาลองใหม่อีกครั้ง"
    }
  },

  account: {
    title: "จัดการบัญชี",
    summary: {
      totalBalance: "ยอดเงินรวม",
      totalIncome: "รายรับรวม",
      totalExpense: "รายจ่ายรวม"
    },
    details: {
      accountName: "ชื่อบัญชี",
      balance: "ยอดเงิน",
      accountType: "ประเภทบัญชี",
      bank: "ธนาคาร",
      actions: {
        edit: "แก้ไข",
        delete: "ลบ"
      }
    },

    addAccount: {
      title: "เพิ่มบัญชีใหม่",
      form: {
        accountName: "ชื่อบัญชี",
        initialBalance: "ยอดเงินเริ่มต้น",
        accountType: "ประเภทบัญชี",
        bank: "เลือกธนาคาร",
        selectType: "เลือกประเภทบัญชี"
      },
      types: {
        savings: "บัญชีออมทรัพย์",
        checking: "บัญชีกระแสรายวัน",
        credit: "บัตรเครดิต",
        investment: "บัญชีลงทุน",
        other: "อื่นๆ"
      },
      validation: {
        required: "กรุณากรอกข้อมูล",
        numberOnly: "กรุณากรอกตัวเลขเท่านั้น",
        positiveNumber: "กรุณากรอกตัวเลขที่มากกว่า 0"
      },
      buttons: {
        add: "เพิ่มบัญชี",
        cancel: "ยกเลิก"
      }
    },

    addDetail: {
      title: "เพิ่มรายการ",
      form: {
        type: "ประเภทรายการ",
        amount: "จำนวนเงิน",
        category: "หมวดหมู่",
        date: "วันที่",
        note: "บันทึก",
        selectCategory: "เลือกหมวดหมู่"
      },
      types: {
        income: "รายรับ",
        expense: "รายจ่าย"
      },
      categories: {
        salary: "เงินเดือน",
        investment: "การลงทุน",
        food: "อาหารและเครื่องดื่ม",
        shopping: "ช้อปปิ้ง",
        transport: "การเดินทาง",
        utilities: "ค่าสาธารณูปโภค",
        other: "อื่นๆ"
      },
      validation: {
        required: "กรุณากรอกข้อมูล",
        numberOnly: "กรุณากรอกตัวเลขเท่านั้น",
        positiveNumber: "กรุณากรอกตัวเลขที่มากกว่า 0"
      },
      buttons: {
        add: "เพิ่มรายการ",
        cancel: "ยกเลิก"
      }
    },
    messages: {
      success: {
        add: "เพิ่มบัญชีสำเร็จ",
        update: "อัพเดทบัญชีสำเร็จ",
        delete: "ลบบัญชีสำเร็จ",
        transaction: "เพิ่มรายการสำเร็จ"
      },
      error: {
        add: "ไม่สามารถเพิ่มบัญชีได้",
        update: "ไม่สามารถอัพเดทบัญชีได้",
        delete: "ไม่สามารถลบบัญชีได้",
        transaction: "ไม่สามารถเพิ่มรายการได้"
      },
      confirm: {
        delete: "คุณแน่ใจหรือไม่ที่จะลบบัญชีนี้?"
      }
    }
  },

  budget: {
    title: "งบประมาณ",
    category: "หมวดหมู่",
    amount: "จำนวนเงิน",
    selectCategory: "เลือกหมวดหมู่",
    cancel: "ยกเลิก",
    save: "บันทึก",
    edit: "แก้ไข",
    delete: "ลบ",
    update: "อัพเดท",
    editBudget: "แก้ไขงบประมาณ",
    monthlyLimit: "วงเงินต่อเดือน",
    left: "เหลือ",
    overspent: "ใช้เกิน",
    createBudgetSuccess: "สร้างงบประมาณสำเร็จ",
    updateBudgetSuccess: "อัพเดทงบประมาณสำเร็จ",
    deleteBudgetSuccess: "ลบงบประมาณสำเร็จ",
    errorMessages: {
      fillAllFields: "กรุณากรอกข้อมูลให้ครบถ้วน",
      failedToCreate: "ไม่สามารถสร้างงบประมาณได้",
      failedToUpdate: "ไม่สามารถอัพเดทงบประมาณได้",
      failedToDelete: "ไม่สามารถลบงบประมาณได้",
      failedToFetch: "ไม่สามารถดึงข้อมูลงบประมาณได้"
    }
  },

  pieChart: {
    // Expense Pie Chart
    expensesReport: "รายงานค่าใช้จ่าย",
    noExpense: "ไม่มีค่าใช้จ่าย",
    error: "ข้อผิดพลาด",

    // Debt Pie Chart
    noDebtData: "ไม่มีข้อมูลหนี้ กรุณาเพิ่มข้อมูลหนี้ของคุณเพื่อดูภาพรวมหนี้ในแผนภูมิวงกลม",
    loading: "กำลังโหลด...",

    // Budget Pie Chart
    totalSpent: "ยอดใช้จ่ายทั้งหมด",
    createBudget: "สร้างงบประมาณ",
    totalBudget: "งบประมาณทั้งหมด",
    remaining: "คงเหลือ",
    spent: "ใช้ไป",
  }
};