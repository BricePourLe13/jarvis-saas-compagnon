'use client'

import React, { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { getSupabaseSingleton } from '@/lib/supabase-singleton'
import Link from 'next/link'
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  BarChart3,
  Building2,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Monitor,
  Activity,
  FileText,
  UserCog,
  Wrench
} from 'lucide-react'
