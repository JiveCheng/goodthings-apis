import type { Schema, Struct } from '@strapi/strapi';

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

export interface BelongExecution extends Struct.ComponentSchema {
  collectionName: 'components_belong_executions';
  info: {
    description: '';
    displayName: 'Execution';
  };
  attributes: {
    execution: Schema.Attribute.Relation<
      'oneToOne',
      'api::execution.execution'
    >;
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

export interface MetaPlan extends Struct.ComponentSchema {
  collectionName: 'components_meta_plans';
  info: {
    description: '';
    displayName: 'Plan/Execution';
    icon: 'bulletList';
  };
  attributes: {
    content: Schema.Attribute.JSON;
    duration: Schema.Attribute.Integer;
    durationUnit: Schema.Attribute.Enumeration<['minutes', 'hours', 'days']>;
    executiveUserId: Schema.Attribute.Integer &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<0>;
    items: Schema.Attribute.Media<
      'images' | 'files' | 'videos' | 'audios',
      true
    >;
    location: Schema.Attribute.String;
    recipient: Schema.Attribute.String & Schema.Attribute.Required;
    start: Schema.Attribute.DateTime;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'belong.comment': BelongComment;
      'belong.execution': BelongExecution;
      'belong.plan': BelongPlan;
      'log.field-change': LogFieldChange;
      'meta.plan': MetaPlan;
    }
  }
}
