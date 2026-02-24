export const ExternalIcon = ({ src, ...rest }: { src: string }) => {
  return (
    <div
      className='flex flex-row justify-center items-center rounded-sm w-6 h-6'
      {...rest}
    >
      <img height="auto" src={src} className='rounded-xs w-full h-full' alt="External Icon" />
    </div>
  )
}
