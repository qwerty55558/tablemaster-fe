"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { IconDevices, IconKey } from "@tabler/icons-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DeviceManagementTab } from "@/components/dashboard/admin/DeviceManagementTab"
import { SecretKeyTab } from "@/components/dashboard/admin/SecretKeyTab"
import { motionConfig } from "@/components/motion"

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = React.useState("devices")

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        <h1 className="text-2xl font-bold tracking-tight">관리자 대시보드</h1>
        <p className="text-muted-foreground">
          디바이스 등록 및 시크릿키를 관리합니다.
        </p>
      </div>

      <div className="px-4 lg:px-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="devices" className="gap-2">
              <IconDevices className="h-4 w-4" />
              디바이스 관리
            </TabsTrigger>
            <TabsTrigger value="secret" className="gap-2">
              <IconKey className="h-4 w-4" />
              시크릿키
            </TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">
            {activeTab === "devices" && (
              <motion.div
                key="devices"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{
                  duration: motionConfig.duration.fast,
                  ease: motionConfig.ease.default,
                }}
              >
                <TabsContent value="devices" forceMount>
                  <DeviceManagementTab />
                </TabsContent>
              </motion.div>
            )}

            {activeTab === "secret" && (
              <motion.div
                key="secret"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{
                  duration: motionConfig.duration.fast,
                  ease: motionConfig.ease.default,
                }}
              >
                <TabsContent value="secret" forceMount>
                  <SecretKeyTab />
                </TabsContent>
              </motion.div>
            )}
          </AnimatePresence>
        </Tabs>
      </div>
    </div>
  )
}
