export interface ActiveWindowInfoOnly {
  title: string
  executable?: string
  className: string
  interactive: 'active' | 'inactive' | 'unknown'
}

export interface ActiveWindowInfo extends ActiveWindowInfoOnly {
  hash: string // This is an MD5 has made out of all the other fields in a JSON string format
}

export interface ActivityPeriod {
  id: string
  start: number
  end: number
  details: ActiveWindowInfoOnly
}

// export interface ActionReport{

// }
