import UserInteractions from "./UserInteractions";
import UniversityDashboardLayout from './../../dashboard/UniversityDashboardLayout';

const ExamDashboard = () => {
    return (
        <UniversityDashboardLayout sidebarOpen={true} setSidebarOpen={true}>
            
            <UserInteractions />



        </UniversityDashboardLayout>
    );
};

export default ExamDashboard;