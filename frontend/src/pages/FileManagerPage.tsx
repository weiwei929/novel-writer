import React from 'react'
import FileImportExport from '../components/FileImportExport/FileImportExport'

const FileManagerPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <FileImportExport />
      </div>
    </div>
  )
}

export default FileManagerPage
