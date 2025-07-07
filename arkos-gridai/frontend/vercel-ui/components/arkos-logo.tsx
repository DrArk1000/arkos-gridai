export function ArkosLogo({ className = "h-8 w-auto" }: { className?: string }) {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className="relative">
        <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-white rounded-sm transform rotate-45"></div>
        </div>
      </div>
      <span className="text-xl font-bold text-white">Arkos</span>
      <span className="text-sm text-blue-300 font-medium">GridAI</span>
    </div>
  )
}
