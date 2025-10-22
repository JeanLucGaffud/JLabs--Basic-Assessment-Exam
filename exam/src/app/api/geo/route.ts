import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const ip = searchParams.get('ip')
    

    let targetIp: string | null = ip
    if (!targetIp) {
      const forwardedFor = request.headers.get('x-forwarded-for')
      targetIp = forwardedFor?.split(',')[0] || 
                 request.headers.get('x-real-ip') || 
                 null
    }
    
    const url = targetIp 
      ? `https://ipinfo.io/${targetIp}/geo` 
      : 'https://ipinfo.io/geo'
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json(
        { error: `API error: ${response.status} - ${errorText}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
    
  } catch (error) {
    console.error('Geo API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch geolocation' },
      { status: 500 }
    )
  }
}
