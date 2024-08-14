import React, { useState, ChangeEvent } from 'react';

const Profile: React.FC = () => {
    const [profileImage, setProfileImage] = useState<string | null>(null);
    const [username, setUsername] = useState<string>('JohnDoe');
    const [dob, setDob] = useState<string>('1990-01-01');
    const [password, setPassword] = useState<string>('');
    const [email, setEmail] = useState<string>('johndoe@example.com');

    const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfileImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleLogout = () => {
        console.log('User logged out');
    };

    return (
        <div className="bg-blue-100 min-h-screen flex flex-col items-center p-4">
            <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
                <div className="flex flex-col items-center">
                    <div className="w-32 h-32 mb-4 relative">
                        {profileImage ? (
                            <img src={profileImage} alt="Profile" className="rounded-full w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-gray-300 rounded-full"></div>
                        )}
                        <input
                            type="file"
                            accept="image/*"
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            onChange={handleImageUpload}
                        />
                    </div>
                    <div className="w-full mb-4">
                        <label className="block text-sm font-medium text-gray-700">Username</label>
                        <input
                            type="text"
                            className="mt-1 p-2 w-full border border-gray-300 rounded-md"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                    </div>
                    <div className="w-full mb-4">
                        <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                        <input
                            type="date"
                            className="mt-1 p-2 w-full border border-gray-300 rounded-md"
                            value={dob}
                            onChange={(e) => setDob(e.target.value)}
                        />
                    </div>
                    <div className="w-full mb-4">
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input
                            type="email"
                            className="mt-1 p-2 w-full border border-gray-300 rounded-md"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div className="w-full mb-4">
                        <label className="block text-sm font-medium text-gray-700">Password</label>
                        <input
                            type="password"
                            className="mt-1 p-2 w-full border border-gray-300 rounded-md"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={handleLogout}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md mt-4 w-full"
                    >
                        Logout
                    </button>
                </div>
            </div>

            <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg">
                <div className="flex justify-around py-2">
                    <button className="text-blue-600">Home</button>
                    <button className="text-blue-600">รายรับรายจ่าย</button>
                    <button className="text-blue-600">บัญชีธนาคาร</button>
                    <button className="text-blue-600">หนี้</button>
                    <button className="text-blue-600">โปรไฟล์</button>
                </div>
            </div>
        </div>
    );
};

export default Profile;
