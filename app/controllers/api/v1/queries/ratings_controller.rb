# frozen_string_literal: true

module Api
  module V1
    module Queries
      class RatingsController < Api::V1::Queries::ApplicationController
        before_action :decode_id

        def update
          @rating = @query.ratings.find_or_create_by doc_id: @id

          if @rating.update rating_params
            Analytics::Tracker.track_rating_created_event current_user, @rating
            respond_with @rating
          else
            render json: @rating.errors, status: :bad_request
          end
        end

        def destroy
          @rating = @query.ratings.where(doc_id: @id).first
          @rating.delete
          Analytics::Tracker.track_rating_deleted_event current_user, @rating

          head :no_content
        end

        private

        def rating_params
          params.permit(:rating)
        end

        def id_base64? id
          !numeric?(id) &&
            Base64.strict_encode64(Base64.strict_decode64(id)) == id ||
            contains_period?(Base64.strict_decode64(id))
        rescue ArgumentError
          false
        end

        def contains_period? string
          string.include?('.')
        end

        def numeric? string
          nil != Float(string)
        rescue ArgumentError
          false
        end

        def decode_id
          @id = params[:doc_id]

          @id = Base64.strict_decode64(@id) if id_base64? @id
        end
      end
    end
  end
end
