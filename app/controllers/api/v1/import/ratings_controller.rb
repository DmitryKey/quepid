# frozen_string_literal: true

module Api
  module V1
    module Import
      class RatingsController < Api::ApiController
        before_action :find_case
        before_action :check_case

        # rubocop:disable Metrics/MethodLength
        def create
          file_format = params[:file_format]
          file_format = 'hash' unless params[:file_format]

          if 'hash' == file_format
            # convert from ActionController::Parameters to a Hash, symbolize, and
            # then return just the ratings as an array.
            ratings = params.permit(ratings:[:query_text, :doc_id, :rating]).to_h.deep_symbolize_keys[:ratings]
          elsif 'rre' == file_format
            # normalize the RRE ratings format to the default hash format.
            ratings = []
            rre_json = JSON.parse(params[:rre_json])
            rre_json['queries'].each do |rre_query|
              query_text = rre_query['placeholders']['$query']
              rre_query['relevant_documents'].each do |rating_value, doc_ids|
                doc_ids.each do |doc_id|
                  rating = {
                    query_text: query_text,
                    doc_id:     doc_id,
                    rating:     rating_value,
                  }
                  ratings << rating
                end
              end
            end
          end

          options = {
            format:         :hash,
            force:          true,
            clear_existing: params[:clear_queries] || false,
            show_progress:  false
          }

          service = RatingsImporter.new @case, ratings, options

          begin
            service.import

            render json: { message: 'Success!' }, status: :ok
          # rubocop:disable Lint/RescueException
          rescue Exception => e
            # TODO: report this to logging infrastructure so we won't lose any important
            # errors that we might have to fix.
            Rails.logger.debug "Import ratings failed: #{e.inspect}"

            render json: { message: e.message }, status: :bad_request
          end
          # rubocop:enable Lint/RescueException
        end
        # rubocop:enable Metrics/MethodLength
      end
    end
  end
end
