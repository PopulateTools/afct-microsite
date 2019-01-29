require "open-uri"
require "csv"
require "json"

namespace :data do
  desc "Export data JSON"
  task :export do
    url = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ5jFM24BkyRdkxBOO_bvVkHj4l2hoJBKZbmjcNJFkppIZyjWLyJe3xApSidfzAU7diZuSX_TP2K-2B/pub?output=csv"
    datasets = []
    CSV.parse(open(url)).each do |row|
      id = row[0]
      data_url = row[1]
      json = JSON.parse(open(URI.escape(data_url)).read)

      datasets.push(id: id, data: json["values"])
    end

    File.write("_static_data/datasets.json", datasets.to_json)
  end
end
