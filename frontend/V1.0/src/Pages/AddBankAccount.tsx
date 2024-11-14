import React from 'react';
import plusIcon from '../Images/plus-icon.png';
import starIcon from '../Images/star.png';

const AddBankAccountPage: React.FC = () => {
    return (
        <div style={{ position: 'relative', width: '430px', height: '932px', backgroundColor: '#F0F6FF' }}>
            {/* Titlebar Bank Account */}
            <div style={{
                position: 'absolute',
                width: '430px',
                height: '90px',
                backgroundColor: '#F9F7F7',
                boxShadow: '0px 3px 4px rgba(0, 0, 0, 0.2)',
                top: '0px',
                left: '0px',
            }}>
                <h1 style={{
                    position: 'absolute',
                    width: '102px',
                    height: '21px',
                    left: '164px',
                    top: '40px',
                    fontFamily: 'IBM Plex Sans',
                    fontWeight: '500',
                    fontSize: '16px',
                    lineHeight: '21px',
                    color: '#0F1035'
                }}>
                    Bank Account
                </h1>
            </div>

            {/* Bank Cards */}
            <div style={{
                position: 'absolute',
                width: '340px',
                height: '200px',
                left: '10.47%',
                right: '10.47%',
                top: '131px',
                backgroundColor: '#4957AA',
                boxShadow: '2px 2px 4px rgba(0, 0, 0, 0.25)',
                borderRadius: '7px'
            }}>
                {/* Kasikorn */}
                <h2 style={{
                    position: 'absolute',
                    left: '25px',
                    top: '10px',
                    fontFamily: 'IBM Plex Sans',
                    fontWeight: 600,
                    fontSize: '24px',
                    lineHeight: '31px',
                    color: '#FFFFFF'
                }}>Kasikorn</h2>

                {/* Miss Jane Cooper */}
                <p style={{
                    position: 'absolute',
                    left: '25px',
                    top: '50px',
                    fontFamily: 'IBM Plex Sans',
                    fontWeight: 400,
                    fontSize: '13px',
                    lineHeight: '17px',
                    color: '#E2E2E2'
                }}>Miss Jane Cooper</p>

                {/* 645-8-23195-9 */}
                <p style={{
                    position: 'absolute',
                    left: '25px',
                    top: '70px',
                    fontFamily: 'IBM Plex Sans',
                    fontWeight: 400,
                    fontSize: '13px',
                    lineHeight: '17px',
                    color: '#E2E2E2'
                }}>645-8-23195-9</p>

                {/* Bank Balance (Baht) */}
                <p style={{
                    position: 'absolute',
                    left: '25px',
                    top: '100px',
                    fontFamily: 'IBM Plex Sans',
                    fontWeight: 400,
                    fontSize: '13px',
                    lineHeight: '17px',
                    color: '#E2E2E2'
                }}>Bank Balance (Baht)</p>

                {/* 25,890.00 Baht */}
                <p style={{
                    position: 'absolute',
                    left: '25px',
                    top: '110px',
                    fontFamily: 'IBM Plex Sans',
                    fontWeight: 500,
                    fontSize: '24px',
                    lineHeight: '31px',
                    color: '#FFFFFF'
                }}>25,890.00 Baht</p>

                {/* Star Icon */}
                <div style={{
                    position: 'absolute',
                    width: '25px',
                    height: '25px',
                    left: '290px',
                    top: '40px',
                }}>
                    <img src={starIcon} alt="Favorite" style={{ width: '25px', height: '25px' }} />
                </div>
            </div>

            {/* Add Rectangle 15 */}
            <div style={{
                position: 'absolute',
                left: '10.47%',
                right: '10.47%',
                top: '38.73%',
                bottom: '12.34%',
                backgroundColor: '#FFFFFF',
                borderRadius: '7px',
                padding: '10px' // เพิ่ม padding เพื่อให้ข้อมูลไม่ติดขอบ
            }}>
                {/* Transaction History */}
                <h3 style={{
                    fontFamily: 'IBM Plex Sans',
                    fontWeight: 600,
                    fontSize: '18px',
                    color: '#333',
                    marginBottom: '10px',
                    position: 'absolute',  // ทำให้ข้อความชิดซ้าย
                    left: '25px'           // ชิดซ้าย 25px
                }}>
                    Latest Transaction History
                </h3>

                <div style={{ marginBottom: '10px', position: 'relative', height: '100px' }}>
                    {/* ทำให้แต่ละ div มี position relative เพื่อใช้ position absolute ภายใน */}

                    <p style={{
                        fontFamily: 'IBM Plex Sans',
                        fontSize: '14px',
                        margin: '0',
                        position: 'absolute',   // ทำให้ข้อความชิดซ้าย
                        left: '15px',            // ชิดซ้าย 25px
                        top: '60px'
                    }}>Deposit</p>

                    <p style={{
                        fontFamily: 'IBM Plex Sans',
                        fontSize: '12px',
                        margin: '0',
                        color: '#888',
                        position: 'absolute',   // ทำให้ข้อความชิดซ้าย
                        left: '15px',           // ชิดซ้าย 25px
                        top: '80px'             // กำหนดตำแหน่งแนวตั้งให้อยู่ด้านล่างของข้อความแรก
                    }}>Account Number 645-8-23195-9</p>

                    <p style={{
                        fontFamily: 'IBM Plex Sans',
                        fontSize: '14px',
                        margin: '0',
                        color: '#4CAF50',
                        position: 'absolute',   // ทำให้ข้อความชิดซ้าย
                        left: '15px',           // ชิดซ้าย 25px
                        top: '100px'             // กำหนดตำแหน่งแนวตั้งให้อยู่ด้านล่างของข้อความที่สอง
                    }}>+500.00 Baht</p>
                </div>

                <div style={{ marginBottom: '10px', position: 'relative', height: '60px' }}>
                    <p style={{
                        fontFamily: 'IBM Plex Sans',
                        fontSize: '14px',
                        margin: '0',
                        position: 'absolute',   // ทำให้ข้อความชิดซ้าย
                        left: '15px',            // ชิดซ้าย 25px
                        top: '25px'
                    }}>Deposit</p>

                    <p style={{
                        fontFamily: 'IBM Plex Sans',
                        fontSize: '12px',
                        margin: '0',
                        color: '#888',
                        position: 'absolute',   // ทำให้ข้อความชิดซ้าย
                        left: '15px',           // ชิดซ้าย 25px
                        top: '45px'
                    }}>Account Number 217-1-65465-3</p>

                    <p style={{
                        fontFamily: 'IBM Plex Sans',
                        fontSize: '14px',
                        margin: '0',
                        color: '#4CAF50',
                        position: 'absolute',   // ทำให้ข้อความชิดซ้าย
                        left: '15px',           // ชิดซ้าย 25px
                        top: '65px'
                    }}>+500.00 Baht</p>

                </div>
                <div style={{
                    position: 'absolute',
                    left: '15px',
                    right: '15px',
                    top: '135px',               // ปรับตำแหน่งตามต้องการ
                    height: '1px',
                    backgroundColor: '#E9E9E9'
                }} />
                <div style={{ marginBottom: '10px', position: 'relative', height: '60px' }}>
                    <p style={{
                        fontFamily: 'IBM Plex Sans',
                        fontSize: '14px',
                        margin: '0',
                        position: 'absolute',   // ทำให้ข้อความชิดซ้าย
                        left: '15px',            // ชิดซ้าย 25px
                        top: '25px'
                    }}>Withdraw</p>

                    <p style={{
                        fontFamily: 'IBM Plex Sans',
                        fontSize: '12px',
                        margin: '0',
                        color: '#888',
                        position: 'absolute',   // ทำให้ข้อความชิดซ้าย
                        left: '15px',           // ชิดซ้าย 25px
                        top: '45px'
                    }}>Account Number 217-1-65465-3</p>

                    <p style={{
                        fontFamily: 'IBM Plex Sans',
                        fontSize: '14px',
                        margin: '0',
                        color: '#BB271A',
                        position: 'absolute',   // ทำให้ข้อความชิดซ้าย
                        left: '15px',           // ชิดซ้าย 25px
                        top: '65px'
                    }}>-100.00 Baht</p>
                </div>
                <div style={{
                    position: 'absolute',
                    left: '15px',
                    right: '15px',
                    top: '207px',               // ปรับตำแหน่งตามต้องการ
                    height: '1px',
                    backgroundColor: '#E9E9E9'
                }} />
                <div style={{ marginBottom: '10px', position: 'relative', height: '60px' }}>
                    <p style={{
                        fontFamily: 'IBM Plex Sans',
                        fontSize: '14px',
                        margin: '0',
                        position: 'absolute',   // ทำให้ข้อความชิดซ้าย
                        left: '15px',            // ชิดซ้าย 25px
                        top: '25px'
                    }}>Withdraw</p>

                    <p style={{
                        fontFamily: 'IBM Plex Sans',
                        fontSize: '12px',
                        margin: '0',
                        color: '#888',
                        position: 'absolute',   // ทำให้ข้อความชิดซ้าย
                        left: '15px',           // ชิดซ้าย 25px
                        top: '45px'
                    }}>Account Number 645-8-23195-9</p>

                    <p style={{
                        fontFamily: 'IBM Plex Sans',
                        fontSize: '14px',
                        margin: '0',
                        color: '#BB271A',
                        position: 'absolute',   // ทำให้ข้อความชิดซ้าย
                        left: '15px',           // ชิดซ้าย 25px
                        top: '65px'
                    }}>-50.00 Baht</p>
                </div>
                <div style={{
                    position: 'absolute',
                    left: '15px',
                    right: '15px',
                    top: '277px',               // ปรับตำแหน่งตามต้องการ
                    height: '1px',
                    backgroundColor: '#E9E9E9'
                }} />
                <div style={{ marginBottom: '10px', position: 'relative', height: '60px' }}>
                    <p style={{
                        fontFamily: 'IBM Plex Sans',
                        fontSize: '14px',
                        margin: '0',
                        position: 'absolute',   // ทำให้ข้อความชิดซ้าย
                        left: '15px',            // ชิดซ้าย 25px
                        top: '25px'
                    }}>Deposit</p>

                    <p style={{
                        fontFamily: 'IBM Plex Sans',
                        fontSize: '12px',
                        margin: '0',
                        color: '#888',
                        position: 'absolute',   // ทำให้ข้อความชิดซ้าย
                        left: '15px',           // ชิดซ้าย 25px
                        top: '45px'
                    }}>Account Number 217-1-65465-3</p>

                    <p style={{
                        fontFamily: 'IBM Plex Sans',
                        fontSize: '14px',
                        margin: '0',
                        color: '#4CAF50',
                        position: 'absolute',   // ทำให้ข้อความชิดซ้าย
                        left: '15px',           // ชิดซ้าย 25px
                        top: '65px'
                    }}>+1,645.00 Baht</p>
                </div>
                <div style={{
                    position: 'absolute',
                    left: '15px',
                    right: '15px',
                    top: '347px',               // ปรับตำแหน่งตามต้องการ
                    height: '1px',
                    backgroundColor: '#E9E9E9'
                }} />
                <div style={{
                    position: 'absolute',
                    left: '15px',
                    right: '15px',
                    top: '420px',               // ปรับตำแหน่งตามต้องการ
                    height: '1px',
                    backgroundColor: '#E9E9E9'
                }} />
            </div>

            {/* Add Bank Account Button */}
            <div style={{
                position: 'absolute',
                left: '345px',
                top: '762px',
                width: '60px',
                height: '60px',
                backgroundColor: '#4957AA',
                borderRadius: '50%',
                boxShadow: '0px 0px 3px 5px rgba(0, 0, 0, 0.1)'
            }}>
                <div style={{
                    position: 'absolute',
                    width: '40px',
                    height: '40px',
                    left: '10px',
                    top: '10px',
                }}>
                    <img src={plusIcon} alt="Add" style={{ width: '40px', height: '40px' }} />
                </div>
            </div>

            {/* Bottom Menu */}
            <div style={{ position: 'absolute', width: '430px', height: '86px', top: '848px', backgroundColor: '#4957AA' }}>
                {/* Add icons and menu items similarly here */}
            </div>
        </div>
    );
};

export default AddBankAccountPage;
