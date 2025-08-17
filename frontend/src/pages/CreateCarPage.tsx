import { useState } from 'react'
import { useNavigate } from 'react-router'
import instance from '../api/axios'
import { isAxiosError } from 'axios'
import { toast } from 'react-toastify'

export default function CreateCarPage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [layout, setLayout] = useState('Sedan (4 seats)')
  const today = new Date()
  const yyyy = today.getFullYear()
  const mm = String(today.getMonth() + 1).padStart(2, '0')
  const dd = String(today.getDate()).padStart(2, '0')
  const defaultDate = `${yyyy}-${mm}-${dd}`
  const [date, setDate] = useState(defaultDate)
  const [time, setTime] = useState('00:00')
  const [error, setError] = useState('')

  const minDate = `${yyyy}-${mm}-${dd}`
  const axios = instance

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        setError('Nejste přihlášeni. Přihlaste se prosím znovu.')
        return
      }
      const localDate = new Date(`${date}T${time}`); // lokální čas
      const dateWithSeconds = localDate.toISOString(); // UTC ISO string
      await axios.post(
        'http://localhost:8000/cars/',
        { name, layout, date: dateWithSeconds },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      navigate('/dashboard')
    } catch (err: unknown) {
      if (isAxiosError(err)) {
        setError(JSON.stringify(err.response?.data) || 'Chyba při vytváření auta.');
        console.error(err);
        toast.error('Chyba vytvoření auta.');
      } else {
        setError('Chyba při vytváření auta.');
        console.error(err);
        toast.error('Chyba vytvoření auta.');
      }
    }
  }

  return (
    <div className="flex items-center justify-center h-screen">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-md shadow-md w-full max-w-md space-y-4"
      >
        <h2 className="text-2xl font-bold mb-4 text-center">Vytvoření auta</h2>

        {error && <div className="text-red-500 text-sm">{error}</div>}

        <div className="radio-inputs-wrapper">
          <div className="radio-inputs">
            <label>
              <input
                className="radio-input"
                type="radio"
                name="layout"
                value="Sedan (4 seats)"
                checked={layout === 'Sedan (4 seats)'}
                onChange={(e) => setLayout(e.target.value)}
              />
              <span className="radio-tile">
                <span className="radio-icon">
                  {/* Sedan SVG */}
                  <svg stroke="currentColor" viewBox="0 0 1280.000000 640.000000" fill="none" width="32" height="32">
                    <g transform="translate(0.000000,640.000000) scale(0.100000,-0.100000)">
                      <path d="M4235 5299 c-410 -26 -906 -96 -1140 -160 -136 -37 -293 -92 -495
                        -174 -234 -95 -347 -148 -1048 -483 l-272 -131 -438 -56 c-240 -31 -454 -61
                        -474 -66 -88 -23 -148 -157 -183 -409 -16 -117 -35 -427 -35 -595 l-1 -110
                        -32 -20 c-39 -25 -71 -80 -91 -159 -14 -57 -13 -77 9 -296 l24 -235 -30 -43
                        -31 -42 22 -45 c27 -57 125 -148 239 -223 l90 -59 238 -32 c131 -18 443 -62
                        693 -98 250 -36 506 -69 569 -72 l115 -6 12 -50 c7 -27 36 -96 64 -151 197
                        -392 691 -578 1190 -448 270 70 495 240 598 454 l47 97 186 -5 185 -5 33 42
                        33 42 337 -6 c185 -3 838 -10 1451 -15 613 -6 1543 -15 2065 -20 934 -10 952
                        -10 1065 10 63 11 124 22 135 25 17 3 29 -10 65 -73 53 -90 185 -229 279 -292
                        270 -181 643 -244 952 -159 235 64 435 219 545 421 l39 72 135 33 c95 23 254
                        47 540 82 l405 49 216 88 216 87 6 211 c3 126 12 249 22 306 28 157 7 286 -52
                        313 -15 7 -27 24 -33 51 -45 176 -182 437 -288 548 -144 151 -827 325 -1798
                        457 -321 44 -655 82 -929 106 l-179 15 -176 104 c-313 186 -695 393 -1067 579
                        -334 167 -765 368 -843 392 -265 83 -655 134 -1175 155 -288 11 -1831 11
                        -2010 -1z m1300 -191 c3 -13 41 -228 86 -478 51 -288 78 -467 74 -487 -7 -39
                        -44 -70 -93 -79 -20 -4 -257 1 -526 10 -601 20 -1090 38 -1093 40 -5 4 -104
                        888 -100 893 18 17 322 64 572 88 236 22 462 32 792 34 l283 1 5 -22z m942
                        -13 c353 -30 557 -72 834 -170 222 -79 502 -225 714 -373 87 -61 242 -179 249
                        -190 2 -4 -24 -7 -58 -8 -202 -2 -305 -242 -157 -367 l33 -27 -32 0 c-30 0
                        -182 6 -1205 50 -274 12 -475 24 -498 31 -44 15 -112 70 -131 108 -12 23 -228
                        629 -317 890 l-29 84 213 -7 c116 -4 289 -14 384 -21z m-2673 -142 c3 -21 26
                        -209 51 -418 25 -209 46 -389 48 -400 2 -18 -3 -20 -68 -17 -38 1 -216 7 -395
                        12 -179 6 -348 15 -377 21 -93 18 -163 86 -203 196 -55 153 17 248 305 404
                        162 88 381 175 575 228 55 15 58 13 64 -26z m-3343 -833 c114 -78 161 -144
                        194 -270 20 -78 30 -273 21 -401 l-8 -97 -219 -7 c-121 -4 -222 -5 -224 -3 -3
                        2 0 95 5 207 15 324 50 492 117 570 19 23 39 41 44 41 6 0 37 -18 70 -40z
                        m3349 -375 c18 -21 16 -64 -4 -83 -15 -15 -46 -17 -251 -17 -256 0 -267 2
                        -267 59 0 55 4 56 267 56 204 0 245 -2 255 -15z m2894 -71 c20 -19 20 -54 2
                        -80 -13 -18 -30 -19 -233 -22 -134 -2 -229 1 -246 7 -40 15 -54 53 -33 86 l16
                        25 240 0 c204 0 241 -2 254 -16z m5607 -340 c32 -31 76 -80 98 -108 41 -53
                        131 -204 131 -220 0 -9 -876 -3 -886 6 -7 8 132 292 152 309 39 33 69 41 212
                        54 244 21 225 23 293 -41z m-1734 -507 c115 -39 201 -93 285 -177 61 -63 86
                        -97 122 -172 61 -125 79 -213 73 -348 -6 -118 -28 -197 -84 -300 -156 -288
                        -504 -426 -818 -326 -109 35 -196 88 -279 172 -83 82 -136 168 -173 279 -23
                        70 -27 96 -27 210 0 114 4 140 27 210 78 237 273 415 512 469 102 23 268 15
                        362 -17z m-7473 -77 c232 -59 416 -233 493 -465 23 -69 27 -98 27 -205 1 -104
                        -3 -137 -22 -200 -72 -231 -248 -403 -487 -476 -92 -28 -276 -25 -375 5 -300
                        92 -501 361 -500 673 0 107 24 201 76 308 142 286 478 440 788 360z"
                      />
                    </g>
                  </svg>
                </span>
                <span className="radio-label">Sedan
                  <p className="radio-description">(4 místa)</p>
                </span>
              </span>
            </label>
            <label>
              <input
                className="radio-input"
                type="radio"
                name="layout"
                value="Coupé (2 seats)"
                checked={layout === 'Coupé (2 seats)'}
                onChange={(e) => setLayout(e.target.value)}
              />
              <span className="radio-tile">
                <span className="radio-icon">
                  {/* Kupé SVG */}
                  <svg stroke="currentColor" viewBox="0 0 324.018 324.017" fill="none" width="32" height="32">
                    <g>
                      <g>
                        <path d="M317.833,197.111c3.346-11.148,2.455-20.541-2.65-27.945c-9.715-14.064-31.308-15.864-35.43-16.076l-8.077-4.352 l-0.528-0.217c-8.969-2.561-42.745-3.591-47.805-3.733c-7.979-3.936-14.607-7.62-20.475-10.879 c-20.536-11.413-34.107-18.958-72.959-18.958c-47.049,0-85.447,20.395-90.597,23.25c-2.812,0.212-5.297,0.404-7.646,0.59 l-6.455-8.733l7.34,0.774c2.91,0.306,4.267-1.243,3.031-3.459c-1.24-2.216-4.603-4.262-7.519-4.57l-23.951-2.524 c-2.91-0.305-4.267,1.243-3.026,3.459c1.24,2.216,4.603,4.262,7.519,4.57l3.679,0.386l8.166,11.05 c-13.823,1.315-13.823,2.139-13.823,4.371c0,18.331-2.343,22.556-2.832,23.369L0,164.443v19.019l2.248,2.89 c-0.088,2.775,0.823,5.323,2.674,7.431c5.981,6.804,19.713,7.001,21.256,7.001c4.634,0,14.211-2.366,20.78-4.153 c-0.456-0.781-0.927-1.553-1.3-2.392c-0.36-0.809-0.603-1.668-0.885-2.517c-0.811-2.485-1.362-5.096-1.362-7.845 c0-14.074,11.449-25.516,25.515-25.516s25.52,11.446,25.52,25.521c0,6.068-2.221,11.578-5.773,15.964 c-0.753,0.927-1.527,1.828-2.397,2.641c-1.022,0.958-2.089,1.859-3.254,2.641c29.332,0.109,112.164,0.514,168.708,1.771 c-0.828-0.823-1.533-1.771-2.237-2.703c-0.652-0.854-1.222-1.75-1.761-2.688c-2.164-3.744-3.5-8.025-3.5-12.655 c0-14.069,11.454-25.513,25.518-25.513c14.064,0,25.518,11.449,25.518,25.513c0,5.126-1.553,9.875-4.152,13.878 c-0.605,0.922-1.326,1.755-2.04,2.594c-0.782,0.922-1.616,1.781-2.527,2.584c5.209,0.155,9.699,0.232,13.546,0.232 c19.563,0,23.385-1.688,23.861-5.018C324.114,202.108,324.472,199.602,317.833,197.111z" />
                        <path d="M52.17,195.175c3.638,5.379,9.794,8.922,16.756,8.922c0.228,0,0.44-0.062,0.663-0.073c2.576-0.083,5.043-0.61,7.291-1.574 c1.574-0.678,2.996-1.6,4.332-2.636c4.782-3.702,7.927-9.429,7.927-15.933c0-11.144-9.066-20.216-20.212-20.216 s-20.213,9.072-20.213,20.216c0,2.263,0.461,4.411,1.149,6.446c0.288,0.85,0.616,1.673,1.015,2.471 C51.279,193.606,51.667,194.434,52.17,195.175z" />
                        <path d="M269.755,209.068c2.656,0,5.173-0.549,7.503-1.481c1.589-0.642,3.06-1.491,4.422-2.495 c1.035-0.767,1.988-1.616,2.863-2.559c3.34-3.604,5.432-8.389,5.432-13.681c0-11.144-9.071-20.21-20.215-20.21 s-20.216,9.066-20.216,20.21c0,4.878,1.812,9.3,4.702,12.801c0.818,0.989,1.719,1.89,2.708,2.713 c1.311,1.088,2.729,2.024,4.293,2.755C263.836,208.333,266.704,209.068,269.755,209.068z" />
                      </g>
                    </g>
                  </svg>
                </span>
                <span className="radio-label">Kupé
                  <p className="radio-description">(2 místa)</p>
                </span>
              </span>
            </label>
            <label>
              <input
                className="radio-input"
                type="radio"
                name="layout"
                value="Minivan (7 seats)"
                checked={layout === 'Minivan (7 seats)'}
                onChange={(e) => setLayout(e.target.value)}
              />
              <span className="radio-tile">
                <span className="radio-icon">
                  {/* Minivan SVG */}
                  <svg stroke="currentColor" viewBox="0 0 90 50" fill="none" width="32" height="32" strokeWidth={0}>
                    <g>
                      <path d="M66.289,37.75c0,3.695,3.002,6.693,6.697,6.693c3.701,0,6.705-2.998,6.705-6.693   c0-3.709-3.002-6.701-6.705-6.701C69.289,31.049,66.289,34.041,66.289,37.75z M69.496,37.75c0-1.936,1.562-3.502,3.49-3.502   c1.936,0,3.498,1.566,3.498,3.502c0,1.932-1.562,3.494-3.498,3.494C71.059,41.244,69.496,39.678,69.496,37.75z" />
                      <path d="M11.106,37.75c0,3.695,3,6.693,6.701,6.693c3.701,0,6.701-2.998,6.701-6.693c0-3.709-3-6.701-6.701-6.701   C14.106,31.049,11.106,34.041,11.106,37.75z M14.315,37.75c0-1.936,1.56-3.502,3.492-3.502c1.934,0,3.496,1.566,3.496,3.502   c0,1.932-1.562,3.494-3.496,3.494C15.877,41.244,14.315,39.678,14.315,37.75z"/>
                      <path d="M2.456,24.771v9.86c0,0,2.371,4.289,7.758,4.289h0.028c-0.06-0.395-0.12-0.783-0.12-1.191   c0-4.262,3.453-7.713,7.715-7.713c4.26,0,7.713,3.453,7.713,7.713c0,0.408-0.062,0.797-0.122,1.191h39.951   c-0.061-0.395-0.119-0.783-0.119-1.191c0-4.262,3.453-7.713,7.717-7.713c4.258,0,7.713,3.453,7.713,7.713   c0,0.408-0.06,0.797-0.123,1.191h0.127h4.201c0,0,2.738-0.824,2.646-5.387c0,0-0.458-8.4-2.283-9.312c0,0-7.486-3.008-11.046-4.013   c0,0-12.142-10.957-29.122-12.508H7.479L3.646,18.198v5.111C3.646,23.309,2.548,23.402,2.456,24.771z M78.251,22.574l4.981,1.911   c2.302,0.672,2.592,3.279,2.592,3.279C80.198,27.139,78.251,22.574,78.251,22.574z M44.86,22.45   c0.011-0.207,0.222-0.36,0.473-0.347l2.303,0.111c0.253,0.012,0.45,0.187,0.438,0.394c-0.008,0.205-0.221,0.359-0.473,0.351   l-2.303-0.112C45.046,22.834,44.852,22.659,44.86,22.45z M43.717,11.534c0,0,15.518,1.098,20.174,8.674l-20.174-1.37V11.534z    M40.796,18.928l-18.989-1.004v-6.391h18.989V18.928z M13.509,20.999c0.011-0.205,0.193-0.364,0.409-0.351l25.233,1.213   c0.215,0.008,0.381,0.182,0.372,0.392c-0.008,0.205-0.192,0.363-0.409,0.351l-25.23-1.211   C13.667,21.381,13.498,21.208,13.509,20.999z M11.491,11.534h8.308v6.572l-8.308-0.547V11.534z"/>
                    </g>
                  </svg>
                </span>
                <span className="radio-label">Minivan
                  <p className="radio-description">(7 míst)</p>
                </span>
              </span>
            </label>
          </div>
        </div>

        <input
          type="text"
          placeholder="Název auta"
          className="w-full p-2 border rounded-md"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <label htmlFor="date" className="block text-gray-700 font-semibold mb-1">Kdy pojedete?</label>
        <div className="flex gap-2 mb-4">
          <input
            id="date"
            type="date"
            className="w-full p-2 border rounded-md"
            value={date}
            min={minDate}
            onChange={(e) => setDate(e.target.value)}
            required
          />
          <input
            id="time"
            type="time"
            className="w-full p-2 border rounded-md"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            required
          />
        </div>
        <div className="text-xs text-gray-500 mb-2">Výchozí čas je 00:00, můžete změnit.</div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
        >
          Vytvořit auto
        </button>
      </form>
    </div>
  )
}
