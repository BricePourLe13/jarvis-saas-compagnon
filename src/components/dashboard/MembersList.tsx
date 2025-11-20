'use client'

import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Search, User } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface Member {
  id: string
  first_name: string
  last_name: string
  email: string | null
  badge_id: string
  is_active: boolean
  member_since: string
  last_visit: string | null
}

interface MembersListProps {
  initialMembers: Member[]
}

export default function MembersList({ initialMembers }: MembersListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  
  const filteredMembers = initialMembers.filter(member => 
    member.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.badge_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (member.email && member.email.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center max-w-sm relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher (nom, badge, email)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px]">Adhérent</TableHead>
              <TableHead>Badge ID</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Dernière visite</TableHead>
              <TableHead className="text-right">Statut</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMembers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  Aucun adhérent trouvé.
                </TableCell>
              </TableRow>
            ) : (
              filteredMembers.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${member.first_name} ${member.last_name}`} />
                        <AvatarFallback>{member.first_name[0]}{member.last_name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span>{member.first_name} {member.last_name}</span>
                        <span className="text-xs text-muted-foreground md:hidden">{member.email}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{member.badge_id}</TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">{member.email || '-'}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {member.last_visit 
                      ? new Date(member.last_visit).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) 
                      : 'Jamais'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant={member.is_active ? "default" : "secondary"} className={member.is_active ? "bg-green-500/15 text-green-700 hover:bg-green-500/25 border-green-200" : ""}>
                      {member.is_active ? "Actif" : "Inactif"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <div className="text-xs text-muted-foreground text-right">
        Total: {filteredMembers.length} adhérent(s)
      </div>
    </div>
  )
}

