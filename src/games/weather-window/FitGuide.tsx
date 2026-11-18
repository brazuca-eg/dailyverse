import { TRIPS, WEATHERS, readFit } from "./catalogue";
import { TripIcon, WeatherIcon } from "./Icons";
import "./FitGuide.css";

interface FitGuideProps {
  trips: readonly number[];
}

export function FitGuide({ trips }: FitGuideProps) {
  return (
    <table className="ww-fit">
      <caption>Fit guide: points each weather gives each trip</caption>
      <thead>
        <tr>
          <td />
          {WEATHERS.map((weather, index) => (
            <th key={weather.id} scope="col">
              <WeatherIcon weather={index} size={20} />
              <span>{weather.label}</span>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {trips.map((trip) => (
          <tr key={TRIPS[trip].id}>
            <th scope="row">
              <TripIcon trip={trip} size={18} />
              <span>{TRIPS[trip].label}</span>
            </th>
            {WEATHERS.map((weather, index) => (
              <td key={weather.id}>{readFit(trip, index)}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
