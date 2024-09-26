import type { Struct, Schema } from '@strapi/strapi';

export interface MetaPlan extends Struct.ComponentSchema {
  collectionName: 'components_meta_plans';
  info: {
    displayName: 'Plan/Execution';
    icon: 'bulletList';
    description: '';
  };
  attributes: {
    executiveUserId: Schema.Attribute.Integer &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<0>;
    recipient: Schema.Attribute.String & Schema.Attribute.Required;
    location: Schema.Attribute.String & Schema.Attribute.Required;
    start: Schema.Attribute.DateTime & Schema.Attribute.Required;
    items: Schema.Attribute.Media<
      'images' | 'files' | 'videos' | 'audios',
      true
    > &
      Schema.Attribute.Required;
    duration: Schema.Attribute.Integer;
    durationUnit: Schema.Attribute.Enumeration<['minutes', 'hours', 'days']>;
  };
}

export interface LogFieldChange extends Struct.ComponentSchema {
  collectionName: 'components_log_field_changes';
  info: {
    displayName: 'FieldChange';
  };
  attributes: {
    fieldName: Schema.Attribute.String & Schema.Attribute.Required;
    from: Schema.Attribute.String;
    to: Schema.Attribute.String;
  };
}

export interface BelongPlan extends Struct.ComponentSchema {
  collectionName: 'components_belong_plans';
  info: {
    displayName: 'Plan';
  };
  attributes: {
    plan: Schema.Attribute.Relation<'oneToOne', 'api::plan.plan'>;
  };
}

export interface BelongExecution extends Struct.ComponentSchema {
  collectionName: 'components_belong_executions';
  info: {
    displayName: 'Execution';
    description: '';
  };
  attributes: {
    execution: Schema.Attribute.Relation<
      'oneToOne',
      'api::execution.execution'
    >;
  };
}

export interface BelongComment extends Struct.ComponentSchema {
  collectionName: 'components_belong_comments';
  info: {
    displayName: 'Comment';
    icon: '';
  };
  attributes: {
    comment: Schema.Attribute.Relation<'oneToOne', 'api::comment.comment'>;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'meta.plan': MetaPlan;
      'log.field-change': LogFieldChange;
      'belong.plan': BelongPlan;
      'belong.execution': BelongExecution;
      'belong.comment': BelongComment;
    }
  }
}
