"use client"

import { useState, useEffect } from "react"
import { Download, RefreshCw, ArrowUpDown, Trash2, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { deleteReport } from "@/services/report-service"

export default function ReportsTable({ reports, loading, onRefresh, onDownload }) {
  const [refreshing, setRefreshing] = useState(false)
  const [sortedReports, setSortedReports] = useState([])
  const [sortDirection, setSortDirection] = useState("desc") // "desc" para descendente (más reciente primero)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [reportToDelete, setReportToDelete] = useState(null)
  const [authErrorModalOpen, setAuthErrorModalOpen] = useState(false)

  // Ordenar los reportes cuando cambian o cuando cambia la dirección de ordenamiento
  useEffect(() => {
    if (!reports || reports.length === 0) {
      setSortedReports([])
      return
    }

    // Crear una copia para no modificar el array original
    const reportsCopy = [...reports]

    // Ordenar por el campo "updated"
    const sorted = reportsCopy.sort((a, b) => {
      const dateA = new Date(getPropertyValue(a, "updated"))
      const dateB = new Date(getPropertyValue(b, "updated"))

      // Verificar si las fechas son válidas
      const isValidDateA = !isNaN(dateA.getTime())
      const isValidDateB = !isNaN(dateB.getTime())

      // Si ambas fechas son válidas, compararlas
      if (isValidDateA && isValidDateB) {
        return sortDirection === "desc" ? dateB - dateA : dateA - dateB
      }

      // Si solo una fecha es válida, ponerla primero
      if (isValidDateA) return sortDirection === "desc" ? -1 : 1
      if (isValidDateB) return sortDirection === "desc" ? 1 : -1

      // Si ninguna fecha es válida, mantener el orden original
      return 0
    })

    setSortedReports(sorted)
  }, [reports, sortDirection])

  // Función para cambiar la dirección de ordenamiento
  const toggleSortDirection = () => {
    setSortDirection((prev) => (prev === "desc" ? "asc" : "desc"))
  }

  // Función para obtener el valor de una propiedad, manejando diferentes estructuras de datos
  const getPropertyValue = (obj, prop) => {
    // Si la propiedad existe directamente
    if (obj[prop] !== undefined) {
      return obj[prop]
    }

    // Si la propiedad está en camelCase o en formato diferente
    const propLower = prop.toLowerCase()
    const keys = Object.keys(obj)

    // Buscar una propiedad que coincida ignorando mayúsculas/minúsculas
    for (const key of keys) {
      if (key.toLowerCase() === propLower) {
        return obj[key]
      }
    }

    // Si no se encuentra, devolver un valor por defecto
    return "N/A"
  }

  // Verificar si el status es "completed"
  const isStatusCompleted = (report) => {
    const status = getPropertyValue(report, "status")
    return status && status.toLowerCase() === "completed"
  }

  // Manejar la descarga del CSV con manejo de errores mejorado
  const handleDownloadj = async (report) => {
    const url = getPropertyValue(report, "url")
    if (!url || url === "N/A") {
      toast.error("URL de descarga no disponible")
      return
    }

    try {
      // Intenta descargar el archivo primero para verificar la autenticación
      const response = await fetch(url)
      
      if (!response.ok) {
        // Si la respuesta es un XML (Azure Blob Storage error)
        const responseText = await response.text()
        if (responseText.includes('<Error>') && responseText.includes('AuthenticationFailed')) {
          setAuthErrorModalOpen(true)
          return
        }
        throw new Error(`Error: ${response.status}`)
      }

      // Si todo está bien, procede con la descarga
      onDownload(url)
    } catch (error) {
      console.error("Error al verificar el archivo:", error)
      if (error.message.includes("Failed to fetch")) {
        setAuthErrorModalOpen(true)
      } else {
        toast.error("Error al descargar el reporte")
      }
    }
  }

  const handleDownload = (report) => {
    const url = getPropertyValue(report, "url")
    if (!url || url === "N/A") {
      toast.error("URL de descarga no disponible")
      return
    }
    onDownload(url)
  }

  //Manejar la eliminacion de CSV
  const handleDelete = (report) => {
    setReportToDelete(report)
    setDeleteModalOpen(true)
  }
  

  const confirmDelete = () => {
    if (!reportToDelete) return
    
    const id = getPropertyValue(reportToDelete, "ReportId")
    if (!id) {
      toast.error("id no disponible para eliminar")
      return
    }
    
    deleteReport(id)
    setDeleteModalOpen(false)
    setReportToDelete(null)
    //window.location.reload()
  }


  // Manejar el refresco de la tabla
  const handleRefresh = async () => {
    try {
      setRefreshing(true)
      await onRefresh()
      toast.success("Los reportes han sido actualizados correctamente")
    } catch (error) {
      toast.error("No se pudieron actualizar los reportes. Por favor, intenta de nuevo.")
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <div className="overflow-x-auto">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-medium">Reports</h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleSortDirection}
            className="flex items-center gap-1"
            title={
              sortDirection === "desc"
                ? "Ordenado de más reciente a más antiguo"
                : "Ordenado de más antiguo a más reciente"
            }
          >
            <ArrowUpDown className="h-4 w-4" />
            <span>{sortDirection === "desc" ? "Más reciente primero" : "Más antiguo primero"}</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading || refreshing}
            className="flex items-center gap-1"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : (
        <Table>
          <TableCaption>List of Pokémon reports available for download</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">ReportId</TableHead>
              <TableHead className="w-[120px]">Status</TableHead>
              <TableHead className="w-[150px]">PokemonType</TableHead>
              <TableHead className="w-[200px]">Created</TableHead>
              <TableHead className="w-[200px]">
                <div className="flex items-center">Updated</div>
              </TableHead>
              <TableHead className="w-[80px]">Action</TableHead>
              <TableHead className="w-[80px]">Delete</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedReports.length > 0 ? (
              sortedReports.map((report, index) => (
                <TableRow key={getPropertyValue(report, "reportId") || index}>
                  <TableCell>{getPropertyValue(report, "reportId")}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        isStatusCompleted(report) ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {getPropertyValue(report, "status")}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="capitalize">{getPropertyValue(report, "pokemonType")}</span>
                  </TableCell>
                  <TableCell>{getPropertyValue(report, "created")}</TableCell>
                  <TableCell>{getPropertyValue(report, "updated")}</TableCell>
                  <TableCell>
                    {isStatusCompleted(report) && (
                      <Button variant="ghost" size="icon" onClick={() => handleDownload(report)} title="Download CSV">
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                  <TableCell>
                    {isStatusCompleted(report) && (
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(report)} className={"text-red-500 hover:text-red-700"} title="Delete CSV">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4">
                  No reports available
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Alert variant="destructive" className="w-full max-w-md relative">
            <button 
              onClick={() => setDeleteModalOpen(false)}
              className="absolute top-3 right-3 p-1 rounded-full hover:bg-red-100/20"
            >
              <X className="h-4 w-4" />
            </button>
            
            <AlertTitle className="text-lg font-semibold">Confirmar eliminación</AlertTitle>
            <AlertDescription className="mt-2">
              ¿Estás seguro que deseas eliminar este reporte? Esta acción no se puede deshacer.
            </AlertDescription>
            
            <div className="mt-4 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={confirmDelete}
              >
                Eliminar
              </Button>
            </div>
          </Alert>
        </div>
      )}
      {authErrorModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Alert variant="destructive" className="w-full max-w-md relative">
            <button 
              onClick={() => setAuthErrorModalOpen(false)}
              className="absolute top-3 right-3 p-1 rounded-full hover:bg-red-100/20"
            >
              <X className="h-4 w-4" />
            </button>
            
            <AlertTitle className="text-lg font-semibold">Error de autenticación</AlertTitle>
            <AlertDescription className="mt-2">
              No se pudo acceder al reporte porque el enlace de descarga ha expirado o no tiene los permisos necesarios.
              Por favor, actualiza la lista de reportes y vuelve a intentarlo.
            </AlertDescription>
            
            <div className="mt-4 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAuthErrorModalOpen(false)}
              >
                Cerrar
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => {
                  setAuthErrorModalOpen(false)
                  handleRefresh()
                }}
              >
                Actualizar reportes
              </Button>
            </div>
          </Alert>
        </div>
      )}
    </div>
  )
}
