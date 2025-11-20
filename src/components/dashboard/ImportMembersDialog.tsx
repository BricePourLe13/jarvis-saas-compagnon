'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Upload, FileText, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import Papa from 'papaparse'
import { createAdminClient } from '@/lib/supabase-admin'
import { useRouter } from 'next/navigation'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'

interface ImportMembersDialogProps {
  gymId: string
  onSuccess: () => void
}

interface CSVMember {
  prenom: string
  nom: string
  email?: string
  badge_id: string
}

export default function ImportMembersDialog({ gymId, onSuccess }: ImportMembersDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [parsing, setParsing] = useState(false)
  const [importing, setImporting] = useState(false)
  const [parsedMembers, setParsedMembers] = useState<CSVMember[]>([])
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const { toast } = useToast()
  const router = useRouter()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      parseCSV(e.target.files[0])
    }
  }

  const parseCSV = (file: File) => {
    setParsing(true)
    setError(null)
    setParsedMembers([])

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setParsing(false)
        
        if (results.errors.length > 0) {
          setError('Le fichier CSV contient des erreurs de formatage.')
          return
        }

        // Validation sommaire des colonnes
        const headers = results.meta.fields || []
        const requiredFields = ['prenom', 'nom', 'badge_id']
        const missingFields = requiredFields.filter(f => !headers.includes(f))

        if (missingFields.length > 0) {
          setError(`Colonnes manquantes : ${missingFields.join(', ')}. Assurez-vous d'avoir les colonnes: prenom, nom, badge_id, email (optionnel).`)
          return
        }

        setParsedMembers(results.data as CSVMember[])
      },
      error: (error) => {
        setParsing(false)
        setError(`Erreur de lecture : ${error.message}`)
      }
    })
  }

  const handleImport = async () => {
    if (parsedMembers.length === 0) return

    setImporting(true)
    setProgress(0)
    let successCount = 0
    let failCount = 0

    try {
      // On envoie par lots de 50 pour ne pas timeout
      const BATCH_SIZE = 50
      const totalBatches = Math.ceil(parsedMembers.length / BATCH_SIZE)

      for (let i = 0; i < parsedMembers.length; i += BATCH_SIZE) {
        const batch = parsedMembers.slice(i, i + BATCH_SIZE)
        
        // Transformation pour l'API
        const membersToInsert = batch.map(m => ({
          gym_id: gymId,
          first_name: m.prenom,
          last_name: m.nom,
          email: m.email || null,
          badge_id: m.badge_id,
          is_active: true,
          member_since: new Date().toISOString(),
          // Valeurs par défaut
          can_use_jarvis: true
        }))

        // Appel API d'import (on utilisera une route API dédiée pour gérer les permissions/validation côté serveur)
        const response = await fetch('/api/manager/members/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ members: membersToInsert })
        })

        if (response.ok) {
          const data = await response.json()
          successCount += data.inserted
          failCount += data.failed
        } else {
          failCount += batch.length
        }

        setProgress(Math.round(((i + BATCH_SIZE) / parsedMembers.length) * 100))
      }

      toast({
        title: 'Import terminé',
        description: `${successCount} adhérents importés, ${failCount} erreurs.`,
        variant: failCount > 0 ? 'default' : 'default', // Ou warning si erreurs
      })

      setIsOpen(false)
      setFile(null)
      setParsedMembers([])
      onSuccess()
      router.refresh()

    } catch (err) {
      console.error(err)
      setError('Erreur lors de l\'importation.')
    } finally {
      setImporting(false)
      setProgress(0)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="mr-2 h-4 w-4" />
          Importer CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Importer des adhérents</DialogTitle>
          <DialogDescription>
            Ajoutez massivement vos adhérents via un fichier CSV.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Instruction format */}
          <Alert className="bg-muted/50 border-none">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Format requis</AlertTitle>
            <AlertDescription className="text-xs text-muted-foreground mt-1">
              Colonnes : <code>prenom</code>, <code>nom</code>, <code>badge_id</code>, <code>email</code> (optionnel).
              <br />
              Le <code>badge_id</code> doit être unique pour votre salle.
            </AlertDescription>
          </Alert>

          {/* Zone upload */}
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="csv-file">Fichier CSV</Label>
            <Input 
              id="csv-file" 
              type="file" 
              accept=".csv" 
              onChange={handleFileChange} 
              disabled={importing}
            />
          </div>

          {/* Preview / Status */}
          {parsing && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Analyse du fichier...
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Erreur</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!parsing && parsedMembers.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
                <CheckCircle2 className="h-4 w-4" />
                {parsedMembers.length} adhérents détectés
              </div>
              <div className="max-h-[150px] overflow-y-auto rounded border bg-muted/50 p-2 text-xs font-mono">
                {parsedMembers.slice(0, 5).map((m, i) => (
                  <div key={i} className="truncate border-b border-border/50 py-1 last:border-0">
                    {m.prenom} {m.nom} - {m.badge_id}
                  </div>
                ))}
                {parsedMembers.length > 5 && (
                  <div className="py-1 text-muted-foreground italic">
                    ... et {parsedMembers.length - 5} autres
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Progress bar */}
          {importing && (
            <div className="space-y-1">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-center text-muted-foreground">Import en cours... {progress}%</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={() => setIsOpen(false)} disabled={importing}>
            Annuler
          </Button>
          <Button onClick={handleImport} disabled={!file || parsing || parsedMembers.length === 0 || importing}>
            {importing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Import...
              </>
            ) : (
              'Lancer l\'import'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

