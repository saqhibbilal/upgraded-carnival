"use client"

import { AuthLayout } from "@/components/layout/auth-layout"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProfileSidebar } from "./components/profile-sidebar"
import { ProgressTab } from "./components/progress-tab"
import { ActivityTab } from "./components/activity-tab"
import { BadgesTab } from "./components/badges-tab"

export default function ProfilePage() {
  return (
    <AuthLayout>
      <div className="p-6">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Profile Sidebar */}
          <div className="w-full md:w-1/3">
            <ProfileSidebar />
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <Tabs defaultValue="progress">
              <TabsList className="mb-6">
                <TabsTrigger value="progress">Progress</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
                <TabsTrigger value="badges">Badges</TabsTrigger>
              </TabsList>

              <TabsContent value="progress">
                <ProgressTab />
              </TabsContent>

              <TabsContent value="activity">
                <ActivityTab />
              </TabsContent>

              <TabsContent value="badges">
                <BadgesTab />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </AuthLayout>
  )
}
