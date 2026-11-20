import { TRIPS, WEATHERS, readFit, readTripLabel, readWeatherLabel } from "./catalogue";
import { TripIcon, WeatherIcon } from "./Icons";
import { t } from "./messages";
import "./FitGuide.css";

interface FitGuideProps {
  trips: readonly number[];
}

export function FitGuide({ trips }: FitGuideProps) {
  return (
    <table className="ww-fit">
      <caption>{t("weather.fit.caption")}</caption>
      <thead>
        <tr>
          <td />
          {WEATHERS.map((weather, index) => (
            <th key={weather.id} scope="col">
              <WeatherIcon weather={index} size={20} />
              <span>{readWeatherLabel(index)}</span>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {trips.map((trip) => (
          <tr key={TRIPS[trip].id}>
            <th scope="row">
              <TripIcon trip={trip} size={18} />
              <span>{readTripLabel(trip)}</span>
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
